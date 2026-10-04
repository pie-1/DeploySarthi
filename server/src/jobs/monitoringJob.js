/**
 * Monitoring job.
 *
 * Every N seconds (default 30):
 * 1. Fetch all active projects
 * 2. For each project, collect metrics
 * 3. Send metrics to incident detector
 * 4. Broadcast metrics to dashboard
 */

/**
 * Metric source.
 * Simulated mode (default) generates realistic readings with occasional anomalies.
 * Real mode will call AWS/Vercel/Supabase APIs (future).
 */

const Project = require('../models/Project');
const { getMetricsForProject } = require('../services/metricSource');
const { processMetrics } = require('../services/incidentDetector');
const { broadcast } = require('../services/wsServer');

const INTERVAL_MS = parseInt(process.env.MONITORING_INTERVAL_MS || '30000', 10);
const LOG_EVERY = parseInt(process.env.LOG_EVERY_TICKS || '10', 10);

let jobHandle = null;
let tick = 0;
let incidentsCreated = 0;

async function runOnce() {
  tick++;
  const startTime = Date.now();
  let projectCount = 0;

  try {
    const projects = await Project.find({}).limit(50);
    projectCount = projects.length;
    if (projectCount === 0) return;

    for (const project of projects) {
      try {
        const metricData = await getMetricsForProject(project);

        broadcast('metrics:update', {
          projectId: project._id.toString(),
          projectName: project.name,
          metrics: metricData.metrics,
          tick,
        });

        const result = await processMetrics(project, metricData);

        if (result.created) {
          incidentsCreated++;
          console.log(
            `[incident] ${project.name} | ${result.incident.title} | severity=${result.incident.severity}`
          );
        }
      } catch (err) {
        console.error(`[error] ${project.name}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[job] ${err.message}`);
  } finally {
    const elapsed = Date.now() - startTime;
    if (tick % LOG_EVERY === 0) {
      console.log(
        `[tick ${tick}] ${projectCount} projects | ${elapsed}ms | incidents_total=${incidentsCreated}`
      );
    }
  }
}

function startMonitoringJob() {
  if (jobHandle) return;
  console.log(`[monitoring] starting (interval=${INTERVAL_MS / 1000}s)`);
  runOnce();
  jobHandle = setInterval(runOnce, INTERVAL_MS);
}

function stopMonitoringJob() {
  if (jobHandle) {
    clearInterval(jobHandle);
    jobHandle = null;
  }
}

module.exports = { startMonitoringJob, stopMonitoringJob, runOnce };