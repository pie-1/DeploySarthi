const Incident = require('../models/Incident');
const Project = require('../models/Project');
const aiService = require('./aiService');
const { buildIncidentContext } = require('./contextBuilder');
const { broadcast } = require('./wsServer');
const { BASELINE } = require('./metricSource');

const recentIncidents = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

const METRIC_LABELS = {
  latency_ms: 'latency',
  error_rate_pct: 'error rate',
  cpu_pct: 'CPU',
  memory_pct: 'memory',
  db_connections: 'DB connections',
};

function metricLabel(metric) {
  return METRIC_LABELS[metric] || metric;
}

function generateIncidentTitle(projectName, symptoms) {
  const prefix = projectName ? `[${projectName}] ` : '';
  if (!symptoms || symptoms.length === 0) return `${prefix}Anomaly detected`;

  const ranked = [...symptoms].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
  );

  const top = ranked[0];
  const others = ranked.slice(1);
  const topLabel = metricLabel(top.metric);
  const topChange = Math.round(Math.abs(top.changePercent));

  if (others.length === 0) return `${prefix}${topLabel} +${topChange}%`;
  if (others.length === 1) {
    const secondLabel = metricLabel(others[0].metric);
    const secondChange = Math.round(Math.abs(others[0].changePercent));
    return `${prefix}${topLabel} +${topChange}%, ${secondLabel} +${secondChange}%`;
  }
  return `${prefix}${topLabel} +${topChange}% + ${others.length} more`;
}

function determineSeverity(flaggedMetrics) {
  if (!flaggedMetrics || flaggedMetrics.length === 0) return 'warning';
  return flaggedMetrics.some((f) => f.level === 'critical') ? 'critical' : 'warning';
}

function buildSymptoms(flaggedMetrics, baseline) {
  return (flaggedMetrics || []).map((f) => {
    const baseValue = baseline[f.metric] ?? f.value;
    const changePercent =
      baseValue > 0 ? ((f.value - baseValue) / baseValue) * 100 : 0;
    return {
      service: 'monitoring',
      metric: f.metric,
      value: f.value,
      baseline: baseValue,
      changePercent: Number(changePercent.toFixed(1)),
      level: f.level,
    };
  });
}

async function processMetrics(project, metricData) {
  const { metrics, baseline } = metricData;

  const lastIncident = recentIncidents.get(project._id.toString());
  if (lastIncident && Date.now() - lastIncident < COOLDOWN_MS) {
    return { skipped: true, reason: 'cooldown' };
  }

  const detection = await aiService.detect(metrics);
  if (!detection.is_anomaly) {
    return { skipped: true, reason: 'no_anomaly', detection };
  }

  const baselineMetrics = baseline || BASELINE;
  const symptoms = buildSymptoms(detection.flagged_metrics, baselineMetrics);
  if (symptoms.length === 0) {
    return { skipped: true, reason: 'no_symptoms' };
  }

  const severity = determineSeverity(detection.flagged_metrics);
  const title = generateIncidentTitle(project.name, symptoms);

  const incident = await Incident.create({
    project: project._id,
    title,
    severity,
    symptoms,
    timeline: [
      {
        timestamp: new Date().toISOString(),
        service: 'monitoring',
        event: `Detected by ${detection.detection_method}`,
      },
    ],
    aiAnalysis: {
      summary: 'AI analysis in progress...',
      confidence: 'medium',
    },
  });

  recentIncidents.set(project._id.toString(), Date.now());

  broadcast('incident:created', {
    _id: incident._id,
    title: incident.title,
    severity: incident.severity,
    startedAt: incident.startedAt,
    project: { name: project.name },
    symptoms: incident.symptoms,
    aiAnalysis: incident.aiAnalysis,
  });

  investigateIncident(incident._id).catch((err) =>
    console.error('[ai] investigation failed:', err.message)
  );

  return { created: true, incident, detection };
}

async function investigateIncident(incidentId) {
  const incident = await Incident.findById(incidentId);
  if (!incident) return;

  const project = await Project.findById(incident.project);
  if (!project) return;

  console.log('[ai] Building context for incident:', incident._id.toString());
  const context = await buildIncidentContext(project, incident);

  const result = await aiService.investigate({
    title: incident.title,
    severity: incident.severity,
    startedAt: incident.startedAt.toISOString(),
    symptoms: incident.symptoms,
    timeline: incident.timeline,
    relatedDeployment: incident.relatedDeployment || {},
    context,
  });

  incident.aiAnalysis = {
    ...result.analysis,
    generatedAt: new Date(),
  };

  incident.timeline.push({
    timestamp: new Date().toISOString(),
    service: 'ai',
    event: 'AI investigation completed',
  });

  await incident.save();

  broadcast('incident:analyzed', {
    _id: incident._id,
    aiAnalysis: incident.aiAnalysis,
    timeline: incident.timeline,
  });

  return incident;
}

module.exports = { processMetrics, investigateIncident };