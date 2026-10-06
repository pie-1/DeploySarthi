import api from './api';

export const aiService = {
  chat: async (payload) => {
    const res = await api.post('/ai/investigate', payload);
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