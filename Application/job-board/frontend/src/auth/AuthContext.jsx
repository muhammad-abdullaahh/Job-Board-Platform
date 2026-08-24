import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('job_board_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('job_board_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const loginUser = (authData) => {
    // authData: { access_token, role, user_id, name, email }
    const userObj = {
      user_id: authData.user_id,
      name: authData.name,
      email: authData.email,
      role: authData.role,
    };
    setToken(authData.access_token);
    setUser(userObj);
    localStorage.setItem('job_board_token', authData.access_token);
    localStorage.setItem('job_board_user', JSON.stringify(userObj));
  };

  const logoutUser = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('job_board_token');
    localStorage.removeItem('job_board_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, loginUser, logoutUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
