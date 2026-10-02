import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('deploysarthi_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('deploysarthi_user');
      }
    }
    setLoading(false);
  }, []);

  const persist = (data) => {
    localStorage.setItem('deploysarthi_user', JSON.stringify(data));
    setUser(data);
  };

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) persist(res.data.data);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.success) persist(res.data.data);
    return res.data;
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    try {
      const res = await api.post('/auth/google', { credential });
      if (res.data.success) persist(res.data.data);
      return res.data;
    } catch (error) {
      console.error('Google login error:', error.response?.data || error.message);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('deploysarthi_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;