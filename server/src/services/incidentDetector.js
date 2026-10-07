const Incident = require('../models/Incident');
const Project = require('../models/Project');
const aiService = require('./aiService');
const { buildIncidentContext } = require('./contextBuilder');
const { broadcast } = require('./wsServer');
const { BASELINE } = require('./metricSource');
const alertService = require('./alertService');

const recentIncidents = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

// Periodic cleanup — hourly, unref so it doesn't block shutdown
setInterval(() => {
  const cutoff = Date.now() - COOLDOWN_MS * 2;
  let cleaned = 0;
  for (const [key, ts] of recentIncidents.entries()) {
    if (ts < cutoff) {
      recentIncidents.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) console.log(`[incidentDetector] Cleaned ${cleaned} stale cooldowns`);
}, 60 * 60 * 1000).unref();

const METRIC_LABELS = {
  latency_ms: 'latency',
  error_rate_pct: 'error rate',
  cpu_pct: 'CPU',
  memory_pct: 'memory',
  db_connections: 'DB connections',
  cost_per_hour: 'cost/hr',
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
      summary: severity === 'critical'
        ? 'AI analysis in progress...'
        : 'Auto-analysis skipped (non-critical). Click "Ask AI" to analyze.',
      confidence: severity === 'critical' ? 'medium' : 'pending',
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

  // Send Telegram alerts (async, non-blocking)
  alertService.dispatchIncident(incident, project)
    .then(async (result) => {
      if (result.sent) {
        await incident.save();
      }
    })
    .catch((err) => console.error('[alert] dispatch failed:', err.message));

  // ─────────────────────────────────────────────────────────────
  // TOKEN OPTIMIZATION: Only auto-investigate critical incidents.
  // Non-critical incidents wait for user to click "Ask AI".
  // ─────────────────────────────────────────────────────────────
  if (severity === 'critical') {
    investigateIncident(incident._id).catch((err) =>
      console.error('[ai] investigation failed:', err.message)
    );
  } else {
    console.log(`[ai] Skipped auto-investigation for ${severity} incident (saves Groq tokens)`);

    // Add a timeline marker so the UI shows the skip
    await Incident.findByIdAndUpdate(incident._id, {
      $push: {
        timeline: {
          timestamp: new Date().toISOString(),
          service: 'ai',
          event: 'AI analysis skipped (non-critical) — click "Ask AI" to analyze',
        },
      },
    }).catch(() => {});
  }

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

  const updated = await Incident.findByIdAndUpdate(
    incidentId,
    {
      $set: { aiAnalysis: { ...result.analysis, generatedAt: new Date() } },
      $push: {
        timeline: {
          timestamp: new Date().toISOString(),
          service: 'ai',
          event: 'AI investigation completed',
        },
      },
    },
    { returnDocument: 'after' }
  );

  if (!updated) return;

  broadcast('incident:analyzed', {
    _id: updated._id,
    aiAnalysis: updated.aiAnalysis,
    timeline: updated.timeline,
  });

  return updated;
}

module.exports = { processMetrics, investigateIncident };