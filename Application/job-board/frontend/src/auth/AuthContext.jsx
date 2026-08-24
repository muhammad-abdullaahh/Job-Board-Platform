import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('job_board_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('job_board_token') || null;
  });

  const loginUser = (tokenData) => {
    setToken(tokenData.access_token);
    const userInfo = {
      user_id: tokenData.user_id,
      name: tokenData.name,
      email: tokenData.email,
      role: tokenData.role,
    };
    setUser(userInfo);
    localStorage.setItem('job_board_token', tokenData.access_token);
    localStorage.setItem('job_board_user', JSON.stringify(userInfo));
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('job_board_token');
    localStorage.removeItem('job_board_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loginUser, logoutUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
