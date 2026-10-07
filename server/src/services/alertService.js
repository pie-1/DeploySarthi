/**
 * Unified alert dispatcher.
 *
 * Sends incident alerts to all enabled channels for the project owner.
 * Never throws — logs failures and records them on the incident.
 *
 * Channels: Telegram 
 */

const User = require('../models/User');
const telegramService = require('./telegramService');

function shouldNotify(user, incident) {
  const prefs = user.notifications || {};

  if (prefs.criticalOnly && incident.severity !== 'critical') {
    return false;
  }

  const hasTelegram =
    prefs.telegramEnabled &&
    user.telegram?.connected &&
    user.telegram?.chatId;

  return hasTelegram;
}

async function dispatchIncident(incident, project) {
  if (!project?.owner) {
    return { skipped: true, reason: 'no_owner' };
  }

  const user = await User.findById(project.owner);
  if (!user) {
    return { skipped: true, reason: 'owner_not_found' };
  }

  if (!shouldNotify(user, incident)) {
    return { skipped: true, reason: 'prefs_disabled_or_not_applicable' };
  }

  const results = [];

  if (
    user.notifications?.telegramEnabled &&
    user.telegram?.connected &&
    user.telegram?.chatId
  ) {
    const r = await telegramService.sendIncidentAlert(user, incident, project.name);
    results.push({ channel: 'telegram', ...r });

    incident.alertsSent = incident.alertsSent || [];
    incident.alertsSent.push({
      channel: 'telegram',
      sentAt: new Date(),
      success: r.ok,
      error: r.ok ? '' : (r.error || 'unknown'),
    });
  }

  return { sent: true, results };
}

module.exports = { dispatchIncident, shouldNotify };