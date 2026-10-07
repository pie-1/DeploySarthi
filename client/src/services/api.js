import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────────────────────
// REQUEST: attach JWT to every outgoing request
// ─────────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  // Prefer the dedicated 'token' key; fall back to embedded token
  let token = localStorage.getItem('token');

  if (!token) {
    const stored = localStorage.getItem('deploysarthi_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        token = parsed?.token;
      } catch {}
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────────────────────
// RESPONSE: only log out on OUR auth failures
// External service 401s (Vercel, GitHub) must NOT log the user out.
// ─────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const message = (error.response?.data?.message || '').toLowerCase();

    // Never log out for external service failures
    const isExternalService =
      url.includes('/vercel/') ||
      url.includes('/github/');

    // Only log out when our JWT is actually rejected
    const isOurAuthFailure =
      status === 401 &&
      !isExternalService &&
      (url.includes('/auth/me') ||
       url.includes('/auth/login') ||
       url.includes('/auth/register') ||
       message.includes('invalid token') ||
       message.includes('no token') ||
       message.includes('token'));

    if (isOurAuthFailure) {
      console.warn('[api] logging out — our JWT rejected');
      localStorage.removeItem('token');
      localStorage.removeItem('deploysarthi_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;