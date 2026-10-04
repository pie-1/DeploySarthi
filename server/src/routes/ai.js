const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/health', async (req, res) => {
  const result = await aiService.health();
  res.json({ success: true, data: result });
});

router.post('/detect', async (req, res) => {
  try {
    const { metrics } = req.body;
    if (!metrics) {
      return res.status(400).json({ success: false, message: 'metrics required' });
    }
    const result = await aiService.detect(metrics);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/investigate', async (req, res) => {
  try {
    const result = await aiService.investigate(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;