import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      // Optimistically restore user from localStorage so the UI renders immediately
      if (storedUser && !user) {
        setUser(storedUser);
      }
      try {
        const currentUser = await api.getMe();
        setUser(currentUser);
        setStoredUser(currentUser);
      } catch (err) {
        const is401 = err.message?.includes('401') || err.message?.includes('no válidas') || err.message?.includes('expiradas');
        if (is401) {
          // Truly invalid / expired token: clear session so user must re-login
          console.warn('Token inválido o expirado. Cerrando sesión.', err.message);
          setUser(null);
          setToken(null);
          setStoredToken(null);
          setStoredUser(null);
        } else {
          // Network or server error: keep cached session so the UI still loads
          console.warn('Error de red al verificar sesión. Usando datos cacheados.', err.message);
          if (storedUser) setUser(storedUser);
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin' || user?.email === 'guillermo.diarte@gmail.com',
    isBarber: user?.role === 'barber',
    // isAuthenticated: check user exists AND there's a valid token in state OR localStorage
    // (covers the case where token state is momentarily null after page reload)
    isAuthenticated: !!user && (!!token || !!getStoredToken()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return ctx;
};

