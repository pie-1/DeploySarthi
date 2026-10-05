const express = require('express');
const router = express.Router();
const vercelService = require('../services/vercelService');
const { protect } = require('../middleware/auth');

router.use(protect);

// ============ STATUS ============

router.get('/status', async (req, res) => {
  try {
    const hasToken = !!process.env.VERCEL_TOKEN;
    res.json({
      success: true,
      data: {
        connected: hasToken,
        mode: hasToken ? 'token' : 'none',
        username: hasToken ? 'pie-1' : '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ VERCEL API PROXIES ============

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

router.post('/auto-deploy', async (req, res) => {
  try {
    const { name, gitRepo, framework } = req.body;

    if (!name || !gitRepo) {
      return res.status(400).json({
        success: false,
        message: 'name and gitRepo are required',
      });
    }

    let project;
    try {
      project = await vercelService.createProjectFromGithub(
        { name, gitRepo, framework },
        null
      );
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || '';
      if (errMsg.includes('already exists')) {
        const projects = await vercelService.listProjects(null, 100);
        const existing = projects.find((p) => p.name === name);
        if (existing) {
          project = {
            id: existing.id,
            name: existing.name,
            url: existing.url,
            framework: existing.framework,
          };
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const deployment = await vercelService.waitForFirstDeployment(project.id, null);

    res.json({
      success: true,
      data: {
        vercelProjectId: project.id,
        vercelProjectName: project.name,
        vercelUrl: project.url,
        deploymentId: deployment?.id || '',
        deploymentState: deployment?.state || 'QUEUED',
        deploymentUrl: deployment?.url || '',
      },
    });
  } catch (err) {
    console.error('[auto-deploy] error:', err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.post('/projects/:id/redeploy', async (req, res) => {
  try {
    const result = await vercelService.redeploy(req.params.id, null);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

module.exports = router;