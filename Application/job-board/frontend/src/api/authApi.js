import axios from 'axios';

const API_BASE = '/api/v1/auth';

export const loginApi = async (email, password, isAdmin = false) => {
  const response = await axios.post(`${API_BASE}/login`, {
    email,
    password,
    is_admin: isAdmin,
  });
  return response.data;
};

export const registerUserApi = async (userData) => {
  const response = await axios.post(`${API_BASE}/register`, userData);
  return response.data;
};

export const registerAdminApi = async (adminData) => {
  const response = await axios.post(`${API_BASE}/register-admin`, adminData);
  return response.data;
};
