const express = require('express');
const router = express.Router();
const User = require('../models/User');
const githubService = require('../services/githubService');
const { protect } = require('../middleware/auth');

// ============ PUBLIC ROUTES ============

router.get('/oauth/start', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_OAUTH_REDIRECT_URI;
  const userId = req.query.userId || '';

  console.log('[oauth-start] userId:', userId || 'MISSING');

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      success: false,
      message: 'GitHub OAuth not configured',
    });
  }

  const scope = 'read:user repo';
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${userId}`;

  res.redirect(url);
});

router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    console.log('[oauth-callback] code:', code ? 'YES' : 'MISSING');
    console.log('[oauth-callback] userId:', userId || 'MISSING');

    if (!code) {
      return res.redirect(`${process.env.CLIENT_URL}/settings?github=error`);
    }

    const accessToken = await githubService.exchangeCodeForToken(code);
    console.log('[oauth-callback] token received');

    const profile = await githubService.getAuthenticatedUser(accessToken);
    console.log('[oauth-callback] profile:', profile.login);

    if (userId && userId !== 'undefined') {
      const updated = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'github.connected': true,
            'github.accessToken': accessToken,
            'github.login': profile.login,
            'github.avatar': profile.avatar,
            'github.connectedAt': new Date(),
          },
        },
        { returnDocument: 'after' }
      );

      console.log('[oauth-callback] saved to:', updated?.email || 'NOT FOUND');
    }

    res.redirect(`${process.env.CLIENT_URL}/settings?github=success`);
  } catch (err) {
    console.error('[oauth-callback] error:', err.message);
    res.redirect(`${process.env.CLIENT_URL}/settings?github=error`);
  }
});

// ============ PROTECTED ROUTES ============

router.use(protect);

router.get('/status', async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const hasOAuth = !!(user?.github?.connected && user?.github?.accessToken);
    const hasPat = !!process.env.GITHUB_TOKEN;

    res.json({
      success: true,
      data: {
        connected: Boolean(hasOAuth || hasPat),
        mode: hasOAuth ? 'oauth' : hasPat ? 'pat' : 'none',
        login: user?.github?.login || '',
        avatar: user?.github?.avatar || '',
        connectedAt: user?.github?.connectedAt || null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        'github.connected': false,
        'github.accessToken': '',
        'github.login': '',
        'github.avatar': '',
        'github.connectedAt': null,
      },
    });
    res.json({ success: true, message: 'GitHub disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

async function resolveToken(userId) {
  const user = await User.findById(userId);
  if (user?.github?.connected && user.github.accessToken) {
    return user.github.accessToken;
  }
  return process.env.GITHUB_PERSONAL_ACCESS_TOKEN || null;
}

router.get('/me', async (req, res) => {
  try {
    const token = await resolveToken(req.userId);
    const user = await githubService.getAuthenticatedUser(token);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
});

router.get('/repos', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const token = await resolveToken(req.userId);
    const repos = await githubService.listRepositories(token, limit);
    res.json({ success: true, data: repos });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
});

router.get('/repos/:owner/:repo/commits', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const limit = parseInt(req.query.limit || '20', 10);
    const token = await resolveToken(req.userId);
    const commits = await githubService.listCommits(`${owner}/${repo}`, { token, limit });
    res.json({ success: true, data: commits });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
});

router.get('/repos/:owner/:repo/commits/:sha', async (req, res) => {
  try {
    const { owner, repo, sha } = req.params;
    const token = await resolveToken(req.userId);
    const commit = await githubService.getCommit(`${owner}/${repo}`, sha, token);
    res.json({ success: true, data: commit });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
});

router.get('/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const token = await resolveToken(req.userId);
    const data = await githubService.getRepository(`${owner}/${repo}`, token);
    res.json({ success: true, data });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      message: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;