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
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get authenticated user's profile.
 */
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

/**
 * List projects.
 */
async function listProjects(token, limit = 30) {
  const client = createClient(token);
  const res = await client.get('/v9/projects', {
    params: { limit },
  });

  return (res.data.projects || []).map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework,
    url: p.alias?.[0]?.domain || `${p.name}.vercel.app`,
    gitRepo: p.link?.repo
      ? `${p.link.org}/${p.link.repo}`
      : p.link?.repoId || '',
    gitBranch: p.link?.productionBranch || 'main',
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));
}

/**
 * Get single project.
 */
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

/**
 * List deployments for a project.
 */
async function listDeployments(projectId, token, limit = 20) {
  const client = createClient(token);
  const res = await client.get('/v6/deployments', {
    params: { projectId, limit },
  });

  return (res.data.deployments || []).map((d) => ({
    id: d.uid,
    name: d.name,
    url: d.url,
    state: d.state, // READY | ERROR | BUILDING | QUEUED | CANCELED
    target: d.target, // production | preview | development
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

/**
 * Get single deployment.
 */
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

/**
 * Trigger a new deployment (redeploy the latest or a specific deployment).
 */
async function triggerDeployment(projectId, options = {}, token) {
  const { name = '', target = 'production' } = options;
  const client = createClient(token);

  const res = await client.post(
    '/v13/deployments',
    {
      name,
      target,
      project: projectId,
    }
  );

  return {
    id: res.data.id,
    url: res.data.url,
    state: res.data.readyState || res.data.status,
  };
}

/**
 * Get deployment build logs.
 */
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

module.exports = {
  getUser,
  listProjects,
  getProject,
  listDeployments,
  getDeployment,
  triggerDeployment,
  getDeploymentLogs,
};