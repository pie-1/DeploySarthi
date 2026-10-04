const express = require('express');
const router = express.Router();
const vercelService = require('../services/vercelService');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/me', async (req, res) => {
  try {
    const user = await vercelService.getUser();
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const projects = await vercelService.listProjects(null, limit);
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const project = await vercelService.getProject(req.params.id, null);
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.get('/projects/:id/deployments', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const deployments = await vercelService.listDeployments(req.params.id, null, limit);
    res.json({ success: true, data: deployments });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.get('/deployments/:id', async (req, res) => {
  try {
    const deployment = await vercelService.getDeployment(req.params.id, null);
    res.json({ success: true, data: deployment });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.get('/deployments/:id/logs', async (req, res) => {
  try {
    const logs = await vercelService.getDeploymentLogs(req.params.id, null);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.post('/projects/:id/deploy', async (req, res) => {
  try {
    const result = await vercelService.triggerDeployment(
      req.params.id,
      req.body || {},
      null
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

module.exports = router;