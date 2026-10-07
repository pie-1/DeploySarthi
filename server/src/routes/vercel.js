const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const vercelService = require('../services/vercelService');
const githubService = require('../services/githubService');
const { encrypt, decrypt, maskToken } = require('../utils/crypto');
const { protect } = require('../middleware/auth');

router.use(protect);

// ─────────────────────────────────────────────────────────────
// Resolve the Vercel token to use for this request.
// ─────────────────────────────────────────────────────────────
async function resolveVercelToken(req) {
  const user = await User.findById(req.userId).select('vercel');

  if (user?.vercel?.connected && user.vercel.accessToken) {
    const decrypted = decrypt(user.vercel.accessToken);
    if (decrypted) {
      return { token: decrypted, source: 'user' };
    }
  }

  if (process.env.VERCEL_TOKEN) {
    return { token: process.env.VERCEL_TOKEN, source: 'server' };
  }

  return null;
}

function externalError(res, err, service = 'vercel') {
  const status = err.response?.status;
  const message = err.response?.data?.error?.message || err.message;

  if (status === 401 || status === 403) {
    console.error(`[${service}] external auth failed:`, message);
    return res.status(502).json({
      success: false,
      message: `${service} integration unavailable`,
      reason: 'external_service_auth',
    });
  }

  res.status(status && status < 500 ? status : 502).json({
    success: false,
    message,
  });
}

// ─────────────────────────────────────────────────────────────
// Detect root directory from GitHub repo structure.
// Priority: explicit body param → GitHub contents API → name heuristic
// ─────────────────────────────────────────────────────────────
const FRONTEND_FOLDER_CANDIDATES = ['client', 'frontend', 'web', 'app'];

async function detectRootDirectoryFromGithub(repoFullName, branch = 'main') {
  try {
    const token = process.env.GITHUB_TOKEN || null;
    const contents = await githubService.getContents(repoFullName, '', branch, token);
    if (!Array.isArray(contents)) return null;

    const folders = contents
      .filter((c) => c.type === 'dir')
      .map((c) => c.name.toLowerCase());

    for (const candidate of FRONTEND_FOLDER_CANDIDATES) {
      if (folders.includes(candidate)) return candidate;
    }
    return null;
  } catch (err) {
    console.warn('[detectRoot] GitHub contents failed:', err.message);
    return null;
  }
}

function detectRootDirectoryFromName(project, repoFullName) {
  const repoName = (repoFullName || project.githubRepo || '').toLowerCase();
  const name = (project.name || '').toLowerCase();

  const knownMonorepos = ['deploysarthi', 'deploy2'];
  if (knownMonorepos.some((m) => repoName.includes(m) || name.includes(m))) {
    return 'client';
  }

  if (
    repoName.includes('frontend') ||
    repoName.includes('web') ||
    name.includes('frontend') ||
    name.includes('web')
  ) {
    return 'client';
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// CONNECT
// ─────────────────────────────────────────────────────────────
router.post('/connect', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string' || token.length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Vercel token required',
      });
    }

    let info;
    try {
      info = await vercelService.verifyToken(token);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Vercel token — verify it at vercel.com/account/tokens',
      });
    }

    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'vercel.connected': true,
        'vercel.accessToken': encrypt(token),
        'vercel.userId': info.userId,
        'vercel.username': info.username,
        'vercel.email': info.email,
        'vercel.teamId': info.teamId || '',
        'vercel.teamName': info.teamName || '',
        'vercel.connectedAt': new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        connected: true,
        username: info.username,
        email: info.email,
        teamName: info.teamName || 'Personal',
      },
    });
  } catch (err) {
    console.error('[vercel/connect] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DISCONNECT
// ─────────────────────────────────────────────────────────────
router.post('/disconnect', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'vercel.connected': false,
        'vercel.accessToken': '',
        'vercel.userId': '',
        'vercel.username': '',
        'vercel.email': '',
        'vercel.teamId': '',
        'vercel.teamName': '',
        'vercel.connectedAt': null,
      },
    });
    res.json({ success: true, message: 'Vercel disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// STATUS
// ─────────────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('vercel');

    const hasUserToken = !!(user?.vercel?.connected && user.vercel.accessToken);
    const hasServerToken = !!process.env.VERCEL_TOKEN;

    res.json({
      success: true,
      data: {
        connected: hasUserToken,
        mode: hasUserToken ? 'user' : (hasServerToken ? 'server' : 'none'),
        username: user?.vercel?.username || '',
        email: user?.vercel?.email || '',
        teamName: user?.vercel?.teamName || '',
        maskedToken: hasUserToken ? maskToken(decrypt(user.vercel.accessToken)) : '',
        connectedAt: user?.vercel?.connectedAt || null,
        serverFallbackAvailable: hasServerToken,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// VERCEL API PROXIES
// ─────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }
    const user = await vercelService.verifyToken(resolved.token);
    res.json({ success: true, data: user });
  } catch (err) {
    externalError(res, err);
  }
});

router.get('/projects', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }
    const limit = parseInt(req.query.limit || '30', 10);
    const projects = await vercelService.listProjects(resolved.token, limit);
    res.json({ success: true, data: projects, source: resolved.source });
  } catch (err) {
    externalError(res, err);
  }
});

router.get('/projects/:id', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }
    const project = await vercelService.getProject(req.params.id, resolved.token);
    res.json({ success: true, data: project });
  } catch (err) {
    externalError(res, err);
  }
});

router.get('/projects/:id/deployments', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }
    const limit = parseInt(req.query.limit || '20', 10);
    const deployments = await vercelService.listDeployments(req.params.id, resolved.token, limit);
    res.json({ success: true, data: deployments });
  } catch (err) {
    externalError(res, err);
  }
});

router.get('/deployments/:id', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }
    const deployment = await vercelService.getDeployment(req.params.id, resolved.token);
    res.json({ success: true, data: deployment });
  } catch (err) {
    externalError(res, err);
  }
});

router.get('/deployments/:id/logs', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }
    const logs = await vercelService.getDeploymentLogs(req.params.id, resolved.token);
    res.json({ success: true, data: logs });
  } catch (err) {
    externalError(res, err);
  }
});

// ─────────────────────────────────────────────────────────────
// AUTO-DEPLOY
// ─────────────────────────────────────────────────────────────
router.post('/auto-deploy', async (req, res) => {
  try {
    const { name, gitRepo, framework, rootDirectory, projectId } = req.body;

    if (!name || !gitRepo) {
      return res.status(400).json({
        success: false,
        message: 'name and gitRepo are required',
      });
    }

    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }

    // ─── Detect root directory ─────────────────────────────
    let finalRootDir = rootDirectory;

    if (!finalRootDir) {
      // 1. Try GitHub contents API (most accurate)
      finalRootDir = await detectRootDirectoryFromGithub(gitRepo);
    }

    if (!finalRootDir && projectId) {
      // 2. Fallback to name heuristic
      const project = await Project.findById(projectId);
      if (project) finalRootDir = detectRootDirectoryFromName(project, gitRepo);
    }

    console.log('[auto-deploy] rootDirectory =', finalRootDir || '(repo root)');

    // ─── Create Vercel project ─────────────────────────────
    let project;
    try {
      project = await vercelService.createProjectFromGithub(
        { name, gitRepo, framework, rootDirectory: finalRootDir },
        resolved.token
      );
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || '';
      if (errMsg.includes('already exists')) {
        const projects = await vercelService.listProjects(resolved.token, 100);
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

    // ─── Wait for auto-triggered deployment ────────────────
    let deployment = await vercelService.waitForFirstDeployment(project.id, resolved.token);

    // ─── Fallback: trigger manually if none appeared ──────
    if (!deployment) {
      try {
        console.log('[auto-deploy] No deployment after 30s, triggering manually');
        deployment = await vercelService.triggerDeployment(
          project.id,
          project.name,
          resolved.token
        );
      } catch (triggerErr) {
        console.warn('[auto-deploy] Manual trigger failed:', triggerErr.message);
      }
    }

    res.json({
      success: true,
      data: {
        vercelProjectId: project.id,
        vercelProjectName: project.name,
        vercelUrl: project.url,
        rootDirectory: finalRootDir,
        deploymentId: deployment?.id || '',
        deploymentState: deployment?.state || 'QUEUED',
        deploymentUrl: deployment?.url || '',
      },
    });
  } catch (err) {
    console.error('[auto-deploy] error:', err.message);
    externalError(res, err);
  }
});

router.post('/projects/:id/redeploy', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first', needsVercel: true });
    }
    const result = await vercelService.redeploy(req.params.id, resolved.token);
    res.json({ success: true, data: result });
  } catch (err) {
    externalError(res, err);
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const resolved = await resolveVercelToken(req);
    if (!resolved) {
      return res.status(400).json({ success: false, message: 'Connect Vercel first' });
    }

    const client = require('axios').create({
      baseURL: 'https://api.vercel.com',
      headers: { Authorization: `Bearer ${resolved.token}` },
    });

    const params = {};
    if (process.env.VERCEL_TEAM_ID) params.teamId = process.env.VERCEL_TEAM_ID;

    await client.delete(`/v9/projects/${req.params.id}`, { params });
    res.json({ success: true, message: 'Vercel project deleted' });
  } catch (err) {
    const status = err.response?.status;
    if (status === 404) {
      return res.json({ success: true, message: 'Already deleted' });
    }
    res.status(status || 500).json({
      success: false,
      message: err.response?.data?.error?.message || err.message,
    });
  }
});

router.post('/projects/:id/unlink', async (req, res) => {
  try {
    await Project.updateMany(
      { vercelProjectId: req.params.id, owner: req.userId },
      {
        $set: {
          vercelProjectId: '',
          vercelProjectName: '',
          vercelUrl: '',
          vercelFramework: '',
        },
      }
    );
    res.json({ success: true, message: 'Unlinked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;