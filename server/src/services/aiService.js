const axios = require('axios');

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Score a metric snapshot for anomaly.
 * @param {Object} metrics - { latency_ms, error_rate_pct, cpu_pct, memory_pct, db_connections }
 */
async function detect(metrics) {
  try {
    const res = await aiClient.post('/detect', { metrics });
    return res.data;
  } catch (err) {
    console.error('AI detect failed:', err.message);
    return {
      is_anomaly: false,
      confidence: 0,
      flagged_metrics: [],
      detection_method: 'ai_unavailable',
    };
  }
}

/**
 * Get LLM-powered incident analysis.
 * @param {Object} incident
 */
async function investigate(incident) {
  try {
    const res = await aiClient.post('/investigate', incident);
    return res.data;
  } catch (err) {
    console.error('AI investigate failed:', err.message);
    return {
      timeline: { timeline: [], root_cause_service: null, affected_services: [] },
      analysis: {
        summary: 'AI service temporarily unavailable.',
        likelyCause: 'Unknown',
        evidence: [],
        suggestedInvestigation: 'Check Python AI service health.',
        confidence: 'low',
        confidenceReason: 'AI service unreachable.',
      },
    };
  }
}

async function health() {
  try {
    const res = await aiClient.get('/health');
    return res.data;
  } catch (err) {
    return { status: 'DOWN', error: err.message };
  }
}

module.exports = { detect, investigate, health };