import api from './api';

export const vercelService = {
  getUser: async () => {
    const res = await api.get('/vercel/me');
    return res.data;
  },

  listProjects: async (limit = 30) => {
    const res = await api.get(`/vercel/projects?limit=${limit}`);
    return res.data;
  },

  getProject: async (id) => {
    const res = await api.get(`/vercel/projects/${id}`);
    return res.data;
  },

  listDeployments: async (projectId, limit = 20) => {
    const res = await api.get(`/vercel/projects/${projectId}/deployments?limit=${limit}`);
    return res.data;
  },

  getDeployment: async (id) => {
    const res = await api.get(`/vercel/deployments/${id}`);
    return res.data;
  },

  getDeploymentLogs: async (id) => {
    const res = await api.get(`/vercel/deployments/${id}/logs`);
    return res.data;
  },

  triggerDeploy: async (projectId, options = {}) => {
    const res = await api.post(`/vercel/projects/${projectId}/deploy`, options);
    return res.data;
  },
};