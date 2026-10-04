/**
 * Metric source.
 *
 * Modes:
 * 1. Simulated — generates realistic metrics with occasional anomalies
 * 2. Real — calls actual AWS/Vercel/Supabase APIs (future)
 *
 * Toggle via USE_SIMULATED_METRICS in .env
 */

const USE_SIMULATED = process.env.USE_SIMULATED_METRICS !== 'false';
const ANOMALY_EVERY = parseInt(process.env.ANOMALY_EVERY_TICKS || '20', 10);

const BASELINE = {
  latency_ms: 180,
  error_rate_pct: 0.2,
  cpu_pct: 22,
  memory_pct: 40,
  db_connections: 20,
};

// Per-project state
const projectState = new Map();

function getProjectState(projectId) {
  if (!projectState.has(projectId)) {
    projectState.set(projectId, {
      tickCount: 0,
      anomalyActive: false,
      anomalyTicksLeft: 0,
      // Slightly offset anomaly timing so projects don't fire together
      offset: Math.floor(Math.random() * ANOMALY_EVERY),
    });
  }
  return projectState.get(projectId);
}

function jitter(base, variance) {
  return base + (Math.random() - 0.5) * variance;
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function simulateMetrics(project) {
  const state = getProjectState(project._id.toString());
  state.tickCount++;

  // Each project fires at its own cadence (with random offset)
  const shouldTrigger =
    (state.tickCount + state.offset) % ANOMALY_EVERY === 0 && !state.anomalyActive;

  if (shouldTrigger) {
    state.anomalyActive = true;
    state.anomalyTicksLeft = 4 + Math.floor(Math.random() * 3); // 4-6 ticks
  }

  if (state.anomalyActive) {
    state.anomalyTicksLeft--;
    if (state.anomalyTicksLeft <= 0) state.anomalyActive = false;
  }

  const metrics = {
    latency_ms: Math.max(50, jitter(BASELINE.latency_ms, 30)),
    error_rate_pct: Math.max(0, jitter(BASELINE.error_rate_pct, 0.5)),
    cpu_pct: Math.max(0, Math.min(100, jitter(BASELINE.cpu_pct, 10))),
    memory_pct: Math.max(0, Math.min(100, jitter(BASELINE.memory_pct, 6))),
    db_connections: Math.max(0, jitter(BASELINE.db_connections, 5)),
  };

  if (state.anomalyActive) {
    const severity = Math.random();
    if (severity > 0.6) {
      // Critical
      metrics.latency_ms = jitter(1100, 200);
      metrics.error_rate_pct = jitter(22, 5);
      metrics.cpu_pct = jitter(88, 6);
      metrics.db_connections = jitter(82, 6);
    } else if (severity > 0.3) {
      // Warning
      metrics.latency_ms = jitter(650, 100);
      metrics.error_rate_pct = jitter(9, 3);
      metrics.cpu_pct = jitter(68, 8);
      metrics.memory_pct = jitter(72, 5);
    } else {
      // Mild
      metrics.latency_ms = jitter(420, 80);
      metrics.error_rate_pct = jitter(4, 1.5);
      metrics.cpu_pct = jitter(58, 6);
    }
  }

  return {
    metrics: {
      latency_ms: round(metrics.latency_ms),
      error_rate_pct: round(metrics.error_rate_pct),
      cpu_pct: round(metrics.cpu_pct),
      memory_pct: round(metrics.memory_pct),
      db_connections: round(metrics.db_connections),
    },
    isSimulatedAnomaly: state.anomalyActive,
    tick: state.tickCount,
    baseline: BASELINE,
  };
}

async function getMetricsForProject(project) {
  if (USE_SIMULATED) return simulateMetrics(project);
  throw new Error('Real metric collection not yet implemented');
}

module.exports = { getMetricsForProject, BASELINE };