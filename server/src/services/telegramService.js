/**
 * Telegram Bot Service.
 *
 * Uses a single DeploySarthi-owned bot to send alerts.
 * Users link their Telegram account via a short-lived token.
 *
 * Env:
 *   TELEGRAM_BOT_TOKEN      — from @BotFather
 *   TELEGRAM_BOT_USERNAME   — e.g. "DeploySarthiBot" (no @)
 */

const axios = require('axios');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'DeploySarthiBot';
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : '';

const isConfigured = () => Boolean(BOT_TOKEN);

async function sendMessage(chatId, text, options = {}) {
  if (!isConfigured()) {
    throw new Error('Telegram bot not configured');
  }
  if (!chatId) {
    throw new Error('chatId is required');
  }

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode || 'Markdown',
    disable_web_page_preview: true,
  };

  if (options.replyMarkup) {
    payload.reply_markup = options.replyMarkup;
  }

  const res = await axios.post(`${API_BASE}/sendMessage`, payload, {
    timeout: 10000,
  });

  return {
    ok: res.data.ok,
    messageId: res.data.result?.message_id,
  };
}

function formatIncidentMessage(incident, projectName = '') {
  const emoji =
    incident.severity === 'critical' ? '🚨' :
    incident.severity === 'warning' ? '⚠️' : 'ℹ️';

  const lines = [];
  lines.push(`${emoji} *${incident.severity.toUpperCase()}*${projectName ? ` · ${projectName}` : ''}`);
  lines.push('');
  lines.push(`*${incident.title}*`);
  lines.push('');

  if (incident.aiAnalysis?.summary) {
    lines.push(`_${incident.aiAnalysis.summary}_`);
    lines.push('');
  }

  if (incident.symptoms?.length) {
    lines.push('*Symptoms:*');
    incident.symptoms.slice(0, 4).forEach((s) => {
      const sign = s.changePercent > 0 ? '+' : '';
      lines.push(`• ${s.metric}: ${s.value} (${sign}${s.changePercent?.toFixed(1)}%)`);
    });
    lines.push('');
  }

  if (incident.aiAnalysis?.confidence) {
    lines.push(`*Confidence:* ${incident.aiAnalysis.confidence}`);
  }

  lines.push('');
  lines.push(`_${new Date(incident.startedAt).toLocaleString()}_`);

  return lines.join('\n');
}

async function sendIncidentAlert(user, incident, projectName) {
  if (!user?.telegram?.connected || !user?.telegram?.chatId) {
    return { ok: false, error: 'User has not linked Telegram' };
  }

  try {
    const text = formatIncidentMessage(incident, projectName);
    const result = await sendMessage(user.telegram.chatId, text);
    return { ok: true, messageId: result.messageId };
  } catch (err) {
    const desc = err.response?.data?.description || err.message;
    console.error('[telegram] send failed:', desc);
    return { ok: false, error: desc };
  }
}

async function health() {
  if (!isConfigured()) {
    return { ok: false, error: 'not_configured' };
  }
  try {
    const res = await axios.get(`${API_BASE}/getMe`, { timeout: 5000 });
    return {
      ok: true,
      username: res.data.result?.username,
      name: res.data.result?.first_name,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function buildDeepLink(token) {
  return `https://t.me/${BOT_USERNAME}?start=${token}`;
}

module.exports = {
  isConfigured,
  sendMessage,
  sendIncidentAlert,
  formatIncidentMessage,
  health,
  buildDeepLink,
  BOT_USERNAME,
};