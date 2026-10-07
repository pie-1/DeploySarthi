/**
 * GitHub API service.
 * Accepts a per-user token, or falls back to the server-configured PAT.
 */

const axios = require('axios');

const GITHUB_API = 'https://api.github.com';

function createClient(userToken) {
  const authToken =
    userToken ||
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;

  if (!authToken) {
    throw new Error('GitHub token not configured');
  }

  return axios.create({
    baseURL: GITHUB_API,
    timeout: 10000,
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'DeploySarthi',
    },
  });
}

async function getAuthenticatedUser(userToken) {
  const client = createClient(userToken);
  const res = await client.get('/user');
  return {
    login: res.data.login,
    name: res.data.name,
    avatar: res.data.avatar_url,
    htmlUrl: res.data.html_url,
  };
}

async function listRepositories(userToken, limit = 30) {
  const client = createClient(userToken);
  const res = await client.get('/user/repos', {
    params: { sort: 'updated', direction: 'desc', per_page: limit, type: 'all' },
  });

  return res.data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    language: repo.language,
    defaultBranch: repo.default_branch,
    stars: repo.stargazers_count,
    isPrivate: repo.private,
    htmlUrl: repo.html_url,
    updatedAt: repo.updated_at,
  }));
}

async function listCommits(repoFullName, options = {}) {
  const { token, limit = 20, branch } = options;
  const client = createClient(token);
  const params = { per_page: limit };
  if (branch) params.sha = branch;

  const res = await client.get(`/repos/${repoFullName}/commits`, { params });

  return res.data.map((commit) => ({
    sha: commit.sha,
    shortSha: commit.sha.slice(0, 7),
    message: commit.commit.message.split('\n')[0],
    author: commit.commit.author?.name || 'unknown',
    authorAvatar: commit.author?.avatar_url || '',
    date: commit.commit.author?.date,
    htmlUrl: commit.html_url,
  }));
}

async function getCommit(repoFullName, sha, userToken) {
  const client = createClient(userToken);
  const res = await client.get(`/repos/${repoFullName}/commits/${sha}`);
  return {
    sha: res.data.sha,
    shortSha: res.data.sha.slice(0, 7),
    message: res.data.commit.message,
    author: res.data.commit.author?.name,
    date: res.data.commit.author?.date,
    filesChanged: res.data.files?.map((f) => f.filename) || [],
    stats: {
      additions: res.data.stats?.additions || 0,
      deletions: res.data.stats?.deletions || 0,
    },
    htmlUrl: res.data.html_url,
  };
}

async function getRepository(repoFullName, userToken) {
  const client = createClient(userToken);
  const res = await client.get(`/repos/${repoFullName}`);
  return {
    id: res.data.id,
    name: res.data.name,
    fullName: res.data.full_name,
    defaultBranch: res.data.default_branch,
    language: res.data.language,
    description: res.data.description,
  };
}

/**
 * Exchange OAuth code for access token.
 */
async function exchangeCodeForToken(code) {
  const res = await axios.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI,
    },
    {
      headers: { Accept: 'application/json' },
      timeout: 10000,
    }
  );

  if (res.data.error) {
    throw new Error(res.data.error_description || 'OAuth exchange failed');
  }

  return res.data.access_token;
}
async function getContents(repoFullName, path, ref = 'main', token = null) {
  const authToken = token || process.env.GITHUB_TOKEN;
  if (!authToken) throw new Error('No GitHub token');

  const res = await axios.get(
    `https://api.github.com/repos/${repoFullName}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/vnd.github+json',
      },
      params: { ref },
      timeout: 10000,
    }
  );
  return res.data;
}

module.exports = {
  getAuthenticatedUser,
  listRepositories,
  listCommits,
  getCommit,
  getRepository,
  exchangeCodeForToken,
  getContents,
};