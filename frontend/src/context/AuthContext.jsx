import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await API.get('/auth/me');
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('loginTime', Date.now().toString());
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    setUser(null);
  };

  const isSessionExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return true;
    return Date.now() - parseInt(loginTime) > SESSION_DURATION;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      // ✅ Check if session expired (24 hours)
      if (isSessionExpired()) {
        clearSession();
        setLoading(false);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        clearSession();
        setLoading(false);
        return;
      }
      setLoading(false);

      // ✅ Validate token with backend silently
      refreshUser().catch(() => {
        clearSession();
      });
    } else {
      clearSession();
      setLoading(false);
    }
  }, []);

  // ✅ Check session on tab focus
  useEffect(() => {
    const handleFocus = () => {
      const token = localStorage.getItem('token');
      if (token && isSessionExpired()) {
        clearSession();
        window.location.href = '/login';
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(res.data.user);
  };

  const register = async (userData) => {
    const res = await API.post('/auth/register', userData);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(res.data.user);
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error('Logout cleanup failed:', error);
    } finally {
      clearSession();
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};