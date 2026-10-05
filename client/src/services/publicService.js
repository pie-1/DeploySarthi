import api from './api';

export const publicService = {
  listProjects: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/public/projects?${query}`);
    return res.data;
  },

  getProject: async (id) => {
    const res = await api.get(`/public/projects/${id}`);
    return res.data;
  },

  toggleLike: async (id) => {
    const res = await api.post(`/public/projects/${id}/like`);
    return res.data;
  },

  listComments: async (id) => {
    const res = await api.get(`/public/projects/${id}/comments`);
    return res.data;
  },

  addComment: async (id, content) => {
    const res = await api.post(`/public/projects/${id}/comments`, { content });
    return res.data;
  },

  deleteComment: async (commentId) => {
    const res = await api.delete(`/public/comments/${commentId}`);
    return res.data;
  },

  getAuthor: async (id) => {
    const res = await api.get(`/public/authors/${id}`);
    return res.data;
  },
};