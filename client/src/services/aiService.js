import api from './api';

export const aiService = {
  chat: async (incident) => {
    const res = await api.post('/ai/investigate', incident);
    return res.data;
  },

  suggestPrompts: async (context) => {
    const res = await api.post('/ai/suggest-prompts', context);
    return res.data;
  },

  health: async () => {
    const res = await api.get('/ai/health');
    return res.data;
  },
};