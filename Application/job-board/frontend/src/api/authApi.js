import axiosClient from './axiosClient';

export const loginApi = async (email, password) => {
  const response = await axiosClient.post('/auth/login', { email, password });
  return response.data;
};

export const registerUserApi = async (userData) => {
  const response = await axiosClient.post('/auth/register', userData);
  return response.data;
};

export const forgotPasswordApi = async (email) => {
  const response = await axiosClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPasswordApi = async (token, newPassword) => {
  const response = await axiosClient.post('/auth/reset-password', {
    token,
    new_password: newPassword,
  });
  return response.data;
};
