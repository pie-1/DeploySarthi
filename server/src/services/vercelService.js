/**
 * Vercel API service.
 * Uses the user's Vercel token, or falls back to server-configured token.
 */

const axios = require('axios');

const VERCEL_API = 'https://api.vercel.com';

function createClient(token) {
  const authToken = token || process.env.VERCEL_TOKEN;
  if (!authToken) {
    throw new Error('Vercel token not configured');
  }
  return axios.create({
    baseURL: VERCEL_API,
    timeout: 15000,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Exchange OAuth code for access token.
 */
async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    client_id: process.env.VERCEL_CLIENT_ID,
    client_secret: process.env.VERCEL_CLIENT_SECRET,
    code,
    redirect_uri: process.env.VERCEL_OAUTH_REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  // NEW endpoint for "Sign in with Vercel"
  const res = await axios.post(
    'https://api.vercel.com/login/oauth/token',
    params.toString(),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    }
  );

  if (!res.data.access_token) {
    throw new Error(res.data.error_description || 'OAuth exchange failed');
  }

  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    idToken: res.data.id_token,
  };
}

async function getUser(token) {
  const client = createClient(token);
  const res = await client.get('/v2/user');
  return {
    id: res.data.user.id,
    username: res.data.user.username,
    name: res.data.user.name,
    email: res.data.user.email,
    avatar: res.data.user.avatar,
  };
}

async function listProjects(token, limit = 30) {
  const client = createClient(token);
  const res = await client.get('/v9/projects', { params: { limit } });

  return (res.data.projects || []).map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework,
    url: p.alias?.[0]?.domain || `${p.name}.vercel.app`,
    gitRepo: p.link?.repo ? `${p.link.org}/${p.link.repo}` : '',
    gitBranch: p.link?.productionBranch || 'main',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

async function getProject(projectIdOrName, token) {
  const client = createClient(token);
  const res = await client.get(`/v9/projects/${projectIdOrName}`);
  const p = res.data;
  return {
    id: p.id,
    name: p.name,
    framework: p.framework,
    url: p.alias?.[0]?.domain || `${p.name}.vercel.app`,
    gitRepo: p.link?.repo ? `${p.link.org}/${p.link.repo}` : '',
    gitBranch: p.link?.productionBranch || 'main',
  };
}

async function listDeployments(projectId, token, limit = 20) {
  const client = createClient(token);
  const res = await client.get('/v6/deployments', {
    params: { projectId, limit },
  });

  return (res.data.deployments || []).map((d) => ({
    id: d.uid,
    name: d.name,
    url: d.url,
    state: d.state,
    target: d.target,
    createdAt: d.created,
    buildingAt: d.buildingAt,
    readyAt: d.ready,
    commit: d.meta?.githubCommitSha
      ? {
          sha: d.meta.githubCommitSha,
          shortSha: d.meta.githubCommitSha.slice(0, 7),
          message: d.meta.githubCommitMessage,
          author: d.meta.githubCommitAuthorName,
          ref: d.meta.githubCommitRef,
        }
      : null,
  }));
}

async function getDeployment(deploymentId, token) {
  const client = createClient(token);
  const res = await client.get(`/v13/deployments/${deploymentId}`);
  const d = res.data;
  return {
    id: d.id,
    url: d.url,
    state: d.readyState || d.state,
    target: d.target,
    createdAt: d.createdAt,
    buildingAt: d.buildingAt,
    ready: d.ready,
    commit: d.meta?.githubCommitSha
      ? {
          sha: d.meta.githubCommitSha,
          shortSha: d.meta.githubCommitSha.slice(0, 7),
          message: d.meta.githubCommitMessage,
          author: d.meta.githubCommitAuthorName,
        }
      : null,
  };
}

async function getDeploymentLogs(deploymentId, token) {
  const client = createClient(token);
  const res = await client.get(`/v3/deployments/${deploymentId}/events`, {
    params: { builds: 1, limit: 200 },
  });
  return (res.data.events || []).map((e) => ({
    created: e.created,
    type: e.type,
    text: e.text || e.payload?.text || '',
  }));
}

async function createProjectFromGithub({ name, gitRepo, framework = null }, token) {
  const client = createClient(token);
  const [org, repo] = gitRepo.split('/');

  if (!org || !repo) {
    throw new Error('Invalid gitRepo format. Expected "owner/repo"');
  }

  const payload = {
    name,
    gitRepository: {
      type: 'github',
      repo: `${org}/${repo}`,
    },
  };

  if (framework) payload.framework = framework;

  const res = await client.post('/v10/projects', payload);

  return {
    id: res.data.id,
    name: res.data.name,
    url: res.data.alias?.[0]?.domain || `${res.data.name}.vercel.app`,
    framework: res.data.framework,
    link: res.data.link,
  };
}

async function redeploy(projectId, token) {
  const client = createClient(token);
  const project = await client.get(`/v9/projects/${projectId}`);
  const projectName = project.data.name;

  const deps = await client.get('/v6/deployments', {
    params: { projectId, limit: 1, target: 'production' },
  });

  const latest = deps.data.deployments?.[0];
  if (!latest) {
    throw new Error('No deployments found. Deploy from GitHub first.');
  }

  const res = await client.post('/v13/deployments', {
    name: projectName,
    project: projectId,
    target: 'production',
    gitSource: {
      type: 'github',
      repoId: latest.meta?.githubRepoId,
      ref: latest.meta?.githubCommitRef,
      sha: latest.meta?.githubCommitSha,
    },
  });

  return {
    id: res.data.id,
    url: res.data.url,
    state: res.data.readyState || res.data.status,
    createdAt: res.data.createdAt,
  };
}

async function deleteProject(projectId, token) {
  const client = createClient(token);
  await client.delete(`/v9/projects/${projectId}`);
  return { success: true };
}

async function waitForFirstDeployment(projectId, token, maxAttempts = 6) {
  const client = createClient(token);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2500));

    try {
      const res = await client.get('/v6/deployments', {
        params: { projectId, limit: 1 },
      });

      const latest = res.data.deployments?.[0];
      if (latest) {
        return {
          id: latest.uid,
          url: latest.url,
          state: latest.state,
          target: latest.target,
          createdAt: latest.created,
        };
      }
    } catch (err) {
      // continue trying
    }
  }

  return null;
}

module.exports = {
  exchangeCodeForToken,
  getUser,
  listProjects,
  getProject,
  listDeployments,
  getDeployment,
  getDeploymentLogs,
  createProjectFromGithub,
  redeploy,
  deleteProject,
  waitForFirstDeployment,
};