import api from './api';

export const userService = {
  getProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data;
  },

  updatePreferences: async (notifications) => {
    const res = await api.patch('/users/preferences', { notifications });
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/users/profile', data);
    return res.data;
  },

  getActivity: async (limit = 10) => {
    const res = await api.get(`/users/activity?limit=${limit}`);
    return res.data;
  },
};