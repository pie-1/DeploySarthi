import api from './api';

export const projectService = {
  getAll: async () => {
    const res = await api.get('/projects');
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/projects', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.patch(`/projects/${id}`, data);
    return res.data;
  },

  remove: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },
};

export const incidentService = {
  getAll: async () => {
    const res = await api.get('/incidents');
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/incidents/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/incidents', data);
    return res.data;
  },

  acknowledge: async (id) => {
    const res = await api.patch(`/incidents/${id}/acknowledge`);
    return res.data;
  },

  resolve: async (id, notes = '') => {
    const res = await api.patch(`/incidents/${id}/resolve`, { notes });
    return res.data;
  },
};

export const aiService = {
  health: async () => {
    const res = await api.get('/ai/health');
    return res.data;
  },

  detect: async (metrics) => {
    const res = await api.post('/ai/detect', { metrics });
    return res.data;
  },

  investigate: async (incident) => {
    const res = await api.post('/ai/investigate', incident);
    return res.data;
  },
};