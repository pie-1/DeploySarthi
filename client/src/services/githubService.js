import api from './api';

export const githubService = {
  getProfile: async () => {
    const res = await api.get('/github/me');
    return res.data;
  },

  listRepos: async (limit = 30) => {
    const res = await api.get(`/github/repos?limit=${limit}`);
    return res.data;
  },

  listCommits: async (owner, repo, limit = 20) => {
    const res = await api.get(`/github/repos/${owner}/${repo}/commits?limit=${limit}`);
    return res.data;
  },

  getCommit: async (owner, repo, sha) => {
    const res = await api.get(`/github/repos/${owner}/${repo}/commits/${sha}`);
    return res.data;
  },

  getRepo: async (owner, repo) => {
    const res = await api.get(`/github/repos/${owner}/${repo}`);
    return res.data;
  },
};