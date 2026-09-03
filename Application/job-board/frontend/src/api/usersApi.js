import axiosClient from './axiosClient';

export const fetchUserProfileApi = async () => {
  const response = await axiosClient.get('/users/me');
  return response.data;
};

export const updateUserProfileApi = async (userData) => {
  const response = await axiosClient.put('/users/me', userData);
  return response.data;
};
