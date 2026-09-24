import axiosClient from './axiosClient';

export const fetchUserProfileApi = async () => {
  const response = await axiosClient.get('/users/me');
  return response.data;
};

export const updateUserProfileApi = async (userData) => {
  const response = await axiosClient.put('/users/me', userData);
  return response.data;
};

export const deleteMyAccountApi = async (password) => {
  const response = await axiosClient.delete('/users/me', { data: { password } });
  return response.data;
};

