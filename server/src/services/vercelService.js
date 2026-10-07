/**
 * Vercel API service.
 * Token passed explicitly per call — no global default.
 */

const axios = require('axios');

const VERCEL_API = 'https://api.vercel.com';
const TEAM_ID = process.env.VERCEL_TEAM_ID || '';

function createClient(token) {
  if (!token) {
    throw new Error('Vercel token required');
  }
  return axios.create({
    baseURL: VERCEL_API,
    timeout: 20000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Verify a token + return user + team info
// ─────────────────────────────────────────────────────────────
async function verifyToken(token) {
  const client = createClient(token);
  const res = await client.get('/v2/user');

  const user = res.data.user;
  let teamId = '';
  let teamName = '';

  // Teams: fetch first team if exists
  try {
    const teamsRes = await client.get('/v2/teams');
    const teams = teamsRes.data.teams || [];
    if (teams.length > 0) {
      teamId = teams[0].id;
      teamName = teams[0].name || teams[0].slug;
    }
  } catch {
    // Not critical
  }

  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    teamId,
    teamName,
  };
}

// ─────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────
async function listProjects(token, limit = 30) {
  const client = createClient(token);
  const params = { limit };
  if (TEAM_ID) params.teamId = TEAM_ID;

  const res = await client.get('/v9/projects', { params });

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
  const params = {};
  if (TEAM_ID) params.teamId = TEAM_ID;

  const res = await client.get(`/v9/projects/${projectIdOrName}`, { params });
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
  const params = { projectId, limit };
  if (TEAM_ID) params.teamId = TEAM_ID;

  const res = await client.get('/v6/deployments', { params });

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
  const params = {};
  if (TEAM_ID) params.teamId = TEAM_ID;

  const res = await client.get(`/v13/deployments/${deploymentId}`, { params });
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
  const params = { builds: 1, limit: 200 };
  if (TEAM_ID) params.teamId = TEAM_ID;

  const res = await client.get(`/v3/deployments/${deploymentId}/events`, { params });
  return (res.data.events || []).map((e) => ({
    created: e.created,
    type: e.type,
    text: e.text || e.payload?.text || '',
  }));
}

// ─────────────────────────────────────────────────────────────
// Create project from GitHub
// ─────────────────────────────────────────────────────────────
async function createProjectFromGithub({ name, gitRepo, framework, rootDirectory = null }, token) {
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
  if (rootDirectory) payload.rootDirectory = rootDirectory;

  const params = {};
  if (TEAM_ID) params.teamId = TEAM_ID;

  const res = await client.post('/v11/projects', payload, { params });

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
  const params = {};
  if (TEAM_ID) params.teamId = TEAM_ID;

  const project = await client.get(`/v9/projects/${projectId}`, { params });
  const projectName = project.data.name;

  const deps = await client.get('/v6/deployments', {
    params: { projectId, limit: 1, target: 'production', ...(TEAM_ID ? { teamId: TEAM_ID } : {}) },
  });

  const latest = deps.data.deployments?.[0];
  if (!latest) {
    throw new Error('No deployments found. Deploy from GitHub first.');
  }

  const res = await client.post(
    '/v13/deployments',
    {
      name: projectName,
      project: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
        repoId: latest.meta?.githubRepoId,
        ref: latest.meta?.githubCommitRef,
        sha: latest.meta?.githubCommitSha,
      },
    },
    { params }
  );

  return {
    id: res.data.id,
    url: res.data.url,
    state: res.data.readyState || res.data.status,
    createdAt: res.data.createdAt,
  };
}

async function waitForFirstDeployment(projectId, token, maxAttempts = 6) {
  const client = createClient(token);

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    try {
      const params = { projectId, limit: 1 };
      if (TEAM_ID) params.teamId = TEAM_ID;
      const res = await client.get('/v6/deployments', { params });
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
    } catch {}
  }

  return null;
}
/**
 * Trigger a fresh deployment for a project.
 * Called after project creation to force first build.
 */
async function triggerDeployment(projectId, projectName, token) {
  const client = createClient(token);
  const params = {};
  if (TEAM_ID) params.teamId = TEAM_ID;

  // Get project details to find default branch
  const projectRes = await client.get(`/v9/projects/${projectId}`, { params });
  const project = projectRes.data;
  const branch = project.link?.productionBranch || 'main';
  const repoId = project.link?.repoId;

  const payload = {
    name: projectName,
    project: projectId,
    target: 'production',
    gitSource: {
      type: 'github',
      repoId,
      ref: branch,
    },
  };

  const res = await client.post('/v13/deployments', payload, { params });

  return {
    id: res.data.id,
    url: res.data.url,
    state: res.data.readyState || res.data.status || 'QUEUED',
    createdAt: res.data.createdAt,
  };
}

module.exports = {
  verifyToken,
  listProjects,
  getProject,
  listDeployments,
  getDeployment,
  getDeploymentLogs,
  createProjectFromGithub,
  redeploy,
  waitForFirstDeployment,
  triggerDeployment,
};