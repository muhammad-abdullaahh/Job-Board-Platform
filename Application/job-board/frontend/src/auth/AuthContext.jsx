import React, { createContext, useState, useEffect } from 'react';
import { logoutApi, refreshTokenApi } from '../api/authApi';
import { setMemoryToken } from '../api/axiosClient';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent token refresh on app startup using httpOnly cookie
  useEffect(() => {
    const initAuth = async () => {
      // Avoid firing refresh request for guest visitors who haven't logged in
      const hasSession = localStorage.getItem('has_session') === 'true';
      if (!hasSession) {
        setLoading(false);
        return;
      }

      try {
        const data = await refreshTokenApi();
        if (data && data.access_token) {
          setMemoryToken(data.access_token);
          setToken(data.access_token);
          setUser({
            user_id: data.user_id,
            name: data.name,
            email: data.email,
            role: data.role,
          });
          localStorage.setItem('has_session', 'true');
        } else {
          localStorage.removeItem('has_session');
        }
      } catch (e) {
        localStorage.removeItem('has_session');
        setMemoryToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const handleTokenRefreshed = (e) => {
      const detail = e.detail;
      if (detail && detail.access_token) {
        localStorage.setItem('has_session', 'true');
        setMemoryToken(detail.access_token);
        setToken(detail.access_token);
        setUser({
          user_id: detail.user_id,
          name: detail.name,
          email: detail.email,
          role: detail.role,
        });
      }
    };

    const handleAuthLogout = () => {
      localStorage.removeItem('has_session');
      setMemoryToken(null);
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth_token_refreshed', handleTokenRefreshed);
    window.addEventListener('auth_logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth_token_refreshed', handleTokenRefreshed);
      window.removeEventListener('auth_logout', handleAuthLogout);
    };
  }, []);

  const loginUser = (authData) => {
    // authData: { access_token, role, user_id, name, email }
    localStorage.setItem('has_session', 'true');
    const userObj = {
      user_id: authData.user_id,
      name: authData.name,
      email: authData.email,
      role: authData.role,
    };
    setMemoryToken(authData.access_token);
    setToken(authData.access_token);
    setUser(userObj);
  };

  const logoutUser = async () => {
    localStorage.removeItem('has_session');
    try {
      await logoutApi();
    } catch (e) {
      // Ignore network errors on logout
    }
    setMemoryToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setUser, loginUser, logoutUser, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
