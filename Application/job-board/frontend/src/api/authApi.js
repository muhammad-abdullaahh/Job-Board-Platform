import axiosClient from './axiosClient';

export const loginApi = async (emailOrData, password) => {
  const payload = typeof emailOrData === 'object' 
    ? emailOrData 
    : { email: emailOrData, password };
  const response = await axiosClient.post('/auth/login', payload);
  return response.data;
};

export const registerUserApi = async (userData) => {
  const response = await axiosClient.post('/auth/register', userData);
  return response.data;
};
export const registerApi = registerUserApi;

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

export const refreshTokenApi = async () => {
  const response = await axiosClient.post('/auth/refresh');
  return response.data;
};

export const logoutApi = async () => {
  const response = await axiosClient.post('/auth/logout');
  return response.data;
};
