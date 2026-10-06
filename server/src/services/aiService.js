const axios = require('axios');

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Score a metric snapshot for anomaly.
 */
async function detect(metrics) {
  try {
    const res = await aiClient.post('/detect', { metrics });
    return res.data;
  } catch (err) {
    console.error('[ai] detect failed:', err.message);
    return {
      is_anomaly: false,
      confidence: 0,
      flagged_metrics: [],
      detection_method: 'ai_unavailable',
    };
  }
}

/**
 * Full incident investigation with rich context.
 */
async function investigate(incident) {
  try {
    const payload = {
      title: incident.title || '',
      severity: incident.severity || 'warning',
      startedAt: incident.startedAt || '',
      symptoms: incident.symptoms || [],
      timeline: incident.timeline || [],
      relatedDeployment: incident.relatedDeployment || {},
      context: incident.context || {},
      userQuestion: incident.userQuestion || '',
    };

    const res = await aiClient.post('/investigate', payload);
    return res.data;
  } catch (err) {
    console.error('[ai] investigate failed:', err.message);
    return {
      timeline: { timeline: [], root_cause_service: null, affected_services: [] },
      analysis: {
        summary: 'AI service temporarily unavailable.',
        evidence: [],
        likelyCause: 'Unknown',
        confidence: 'low',
        confidenceReason: 'AI service unreachable.',
        recommendedNext: 'Check Python AI service health.',
        suggestedQuestions: [],
      },
    };
  }
}

/**
 * Generate contextual investigation questions.
 */
async function suggestPrompts(context) {
  try {
    const res = await aiClient.post('/suggest-prompts', context);
    return res.data;
  } catch (err) {
    console.error('[ai] suggest-prompts failed:', err.message);
    return { suggestions: [] };
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

module.exports = { detect, investigate, suggestPrompts, health };