import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('deploysarthi_user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('deploysarthi_user');
        localStorage.removeItem('token');
      }
    } else {
      localStorage.removeItem('deploysarthi_user');
      localStorage.removeItem('token');
    }
    setLoading(false);
  }, []);

  const persist = (data) => {
    localStorage.setItem('deploysarthi_user', JSON.stringify(data));
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    setUser(data);
    window.dispatchEvent(new Event('auth:changed'));  // ← NEW
  };

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) persist(res.data.data);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password, phone) => {
    const res = await api.post('/auth/register', { name, email, password, phone });
    if (res.data.success) persist(res.data.data);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('deploysarthi_user');
    localStorage.removeItem('token');
    setUser(null);
    window.dispatchEvent(new Event('auth:changed'));  // ← NEW
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;