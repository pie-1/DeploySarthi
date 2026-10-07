/**
 * Telegram integration routes.
 *
 * Flow:
 *  1. User clicks "Connect Telegram" → POST /api/telegram/link
 *     → server generates token, returns deep link
 *  2. User opens deep link in Telegram → sends /start <token> to bot
 *  3. Telegram calls POST /api/telegram/webhook
 *     → server finds user by token, saves chatId, marks connected
 *  4. Future alerts are sent via telegramService
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const telegramService = require('../services/telegramService');
const { protect } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('telegram');
    res.json({
      success: true,
      data: {
        botConfigured: telegramService.isConfigured(),
        botUsername: telegramService.BOT_USERNAME,
        connected: !!user?.telegram?.connected,
        username: user?.telegram?.username || '',
        firstName: user?.telegram?.firstName || '',
        connectedAt: user?.telegram?.connectedAt || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// LINK — generate token + return deep link
// ─────────────────────────────────────────────────────────────
router.post('/link', protect, async (req, res) => {
  try {
    if (!telegramService.isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Telegram bot not configured on server',
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = user.generateTelegramLinkToken();
    await user.save();

    const deepLink = telegramService.buildDeepLink(token);

    res.json({
      success: true,
      data: {
        deepLink,
        botUsername: telegramService.BOT_USERNAME,
        expiresInSeconds: 15 * 60,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DISCONNECT
// ─────────────────────────────────────────────────────────────
router.post('/disconnect', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'telegram.connected': false,
        'telegram.chatId': '',
        'telegram.username': '',
        'telegram.firstName': '',
        'telegram.connectedAt': null,
        'notifications.telegramEnabled': false,
      },
    });
    res.json({ success: true, message: 'Telegram disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// WEBHOOK — called by Telegram (PUBLIC, no JWT)
// ─────────────────────────────────────────────────────────────
router.post('/webhook', async (req, res) => {
  // Respond 200 immediately so Telegram doesn't retry
  res.json({ ok: true });

  try {
    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message?.text) return;

    const text = message.text.trim();
    const chatId = message.chat?.id;
    const from = message.from || {};
    const username = from.username || '';
    const firstName = from.first_name || '';

    if (!text.startsWith('/start')) return;

    const parts = text.split(/\s+/);
    const token = parts[1];

    if (!token) {
      await telegramService.sendMessage(
        chatId,
        '👋 *Welcome to DeploySarthi!*\n\n' +
        'To connect this chat, go to your dashboard → Settings → Connect Telegram.'
      ).catch(() => {});
      return;
    }

    const user = await User.findOne({
      'telegram.linkToken': token,
      'telegram.linkTokenExpiresAt': { $gt: new Date() },
    });

    if (!user) {
      await telegramService.sendMessage(
        chatId,
        '❌ This link has expired or is invalid.\n\n' +
        'Generate a new link from your DeploySarthi settings.'
      ).catch(() => {});
      return;
    }

    user.telegram.connected = true;
    user.telegram.chatId = String(chatId);
    user.telegram.username = username;
    user.telegram.firstName = firstName;
    user.telegram.connectedAt = new Date();
    user.telegram.linkToken = '';
    user.telegram.linkTokenExpiresAt = null;
    user.notifications.telegramEnabled = true;
    await user.save();

    await telegramService.sendMessage(
      chatId,
      `✅ *Connected!*\n\nHi ${firstName || 'there'}, you'll now receive incident alerts here.`
    ).catch(() => {});

    console.log(`[telegram] user ${user.email} linked to chat ${chatId}`);
  } catch (err) {
    console.error('[telegram] webhook error:', err.message);
  }
});

// ─────────────────────────────────────────────────────────────
// TEST — send a test message
// ─────────────────────────────────────────────────────────────
router.post('/test', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('telegram');
    if (!user?.telegram?.connected || !user?.telegram?.chatId) {
      return res.status(400).json({ success: false, message: 'Telegram not connected' });
    }
    const result = await telegramService.sendMessage(
      user.telegram.chatId,
      '✅ *Test message*\n\nYour DeploySarthi alerts are working.'
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// HEALTH — public
// ─────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  const result = await telegramService.health();
  res.json({ success: true, data: result });
});

module.exports = router;