/**
 * Metric source.
 *
 * Modes:
 * 1. Simulated — generates realistic metrics with occasional anomalies
 * 2. Real — calls actual AWS/Vercel/Supabase APIs (future)
 *
 * Toggle via USE_SIMULATED_METRICS in .env
 *
 * Environment:
 *  - ANOMALY_EVERY_TICKS   — anomaly fires every N ticks (default 20)
 *  - CRITICAL_FREQUENCY    — threshold for critical severity (default 0.8)
 *  - MAX_INCIDENTS_PER_HOUR — global cap across all projects (default 3)
 */

const USE_SIMULATED = process.env.USE_SIMULATED_METRICS !== 'false';
const ANOMALY_EVERY = parseInt(process.env.ANOMALY_EVERY_TICKS || '20', 10);
const CRITICAL_THRESHOLD = parseFloat(process.env.CRITICAL_FREQUENCY || '0.8');
const WARNING_THRESHOLD = parseFloat(process.env.WARNING_FREQUENCY || '0.3');
const MAX_INCIDENTS_PER_HOUR = parseInt(process.env.MAX_INCIDENTS_PER_HOUR || '3', 10);

const BASELINE = {
  latency_ms: 180,
  error_rate_pct: 0.2,
  cpu_pct: 22,
  memory_pct: 40,
  db_connections: 20,
  cost_per_hour: 8.5,
};

// ─────────────────────────────────────────────────────────────
// Global hourly incident budget — prevents Groq token exhaustion
// ─────────────────────────────────────────────────────────────
let hourlyBudget = MAX_INCIDENTS_PER_HOUR;
let budgetResetAt = Date.now() + 3600 * 1000;

function canCreateIncident() {
  if (Date.now() > budgetResetAt) {
    hourlyBudget = MAX_INCIDENTS_PER_HOUR;
    budgetResetAt = Date.now() + 3600 * 1000;
    console.log(`[metricSource] Hourly incident budget reset to ${MAX_INCIDENTS_PER_HOUR}`);
  }
  if (hourlyBudget <= 0) return false;
  hourlyBudget--;
  return true;
}

// ─────────────────────────────────────────────────────────────
// Per-project state with cleanup
// ─────────────────────────────────────────────────────────────
const projectState = new Map();

function getProjectState(projectId) {
  if (!projectState.has(projectId)) {
    projectState.set(projectId, {
      tickCount: 0,
      anomalyActive: false,
      anomalyTicksLeft: 0,
      offset: Math.floor(Math.random() * ANOMALY_EVERY),
      lastSeenAt: Date.now(),
    });
  }
  const state = projectState.get(projectId);
  state.lastSeenAt = Date.now();
  return state;
}

// Cleanup stale state hourly
setInterval(() => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let cleaned = 0;
  for (const [projectId, state] of projectState.entries()) {
    if (state.lastSeenAt < cutoff) {
      projectState.delete(projectId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`[metricSource] Cleaned ${cleaned} stale project states`);
  }
}, 60 * 60 * 1000).unref();

function jitter(base, variance) {
  return base + (Math.random() - 0.5) * variance;
}

function round(value, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function simulateMetrics(project) {
  const state = getProjectState(project._id.toString());
  state.tickCount++;

  const shouldTrigger =
    (state.tickCount + state.offset) % ANOMALY_EVERY === 0 &&
    !state.anomalyActive &&
    canCreateIncident();

  if (shouldTrigger) {
    state.anomalyActive = true;
    state.anomalyTicksLeft = 4 + Math.floor(Math.random() * 3);
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
    cost_per_hour: Math.max(0, jitter(BASELINE.cost_per_hour, 2)),
  };

  if (state.anomalyActive) {
    const severity = Math.random();
    if (severity > CRITICAL_THRESHOLD) {
      metrics.latency_ms = jitter(1100, 200);
      metrics.error_rate_pct = jitter(22, 5);
      metrics.cpu_pct = jitter(88, 6);
      metrics.db_connections = jitter(82, 6);
      metrics.cost_per_hour = jitter(45, 8);
    } else if (severity > WARNING_THRESHOLD) {
      metrics.latency_ms = jitter(650, 100);
      metrics.error_rate_pct = jitter(9, 3);
      metrics.cpu_pct = jitter(68, 8);
      metrics.memory_pct = jitter(72, 5);
      metrics.cost_per_hour = jitter(22, 4);
    } else {
      metrics.latency_ms = jitter(420, 80);
      metrics.error_rate_pct = jitter(4, 1.5);
      metrics.cpu_pct = jitter(58, 6);
      metrics.cost_per_hour = jitter(14, 3);
    }
  }

  return {
    metrics: {
      latency_ms: round(metrics.latency_ms),
      error_rate_pct: round(metrics.error_rate_pct),
      cpu_pct: round(metrics.cpu_pct),
      memory_pct: round(metrics.memory_pct),
      db_connections: round(metrics.db_connections),
      cost_per_hour: round(metrics.cost_per_hour),
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