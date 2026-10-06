const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_SID;
const AUTH_TOKEN = process.env.TWILIO_TOKEN;
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '977';

let client = null;
if (ACCOUNT_SID && AUTH_TOKEN) {
  client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  console.log('[twilio] Initialized WhatsApp service');
} else {
  console.log('[twilio] Credentials missing — WhatsApp alerts disabled');
}

async function sendIncidentAlert({ user, incident, project }) {
  if (!client) {
    return { sent: false, reason: 'not_configured' };
  }

  if (user?.notifications?.whatsappEnabled === false) {
    return { sent: false, reason: 'user_disabled' };
  }

  const phone = user?.phone?.replace(/\D/g, '');
  if (!phone || phone.length !== 10) {
    return { sent: false, reason: 'no_phone' };
  }

  if (user.notifications?.criticalOnly && incident.severity !== 'critical') {
    return { sent: false, reason: 'critical_only_filter' };
  }

  const recipient = `whatsapp:+${DEFAULT_COUNTRY_CODE}${phone}`;

  // Build simple body
  const aiSummary = incident.aiAnalysis?.summary || '';
  const body = `🔴 DeploySarthi Alert

Severity: ${incident.severity.toUpperCase()}
Project: ${project?.name || 'Unknown'}
Incident: ${incident.title}

${aiSummary ? `AI Summary:\n${aiSummary}\n` : ''}
View: http://localhost:5173/incidents/${incident._id}`;

  try {
    // Use raw REST call to sandbox endpoint
    const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
    const params = new URLSearchParams({
      From: FROM_NUMBER,
      To: recipient,
      Body: body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('[twilio] Raw API error:', data.message);
      return { sent: false, reason: 'send_failed', error: data.message };
    }

    console.log(`[twilio] Sent to ${recipient} · SID ${data.sid}`);
    return { sent: true, sid: data.sid };
  } catch (err) {
    console.error('[twilio] Send failed:', err.message);
    return { sent: false, reason: 'send_failed', error: err.message };
  }
}

module.exports = { sendIncidentAlert };