import axiosClient from './axiosClient';

export const fetchUsersApi = async () => {
  const response = await axiosClient.get('/users');
  return response.data;
};

export const deleteUserApi = async (userId) => {
  const response = await axiosClient.delete(`/users/${userId}`);
  return response.data;
};

export const verifyCompanyApi = async (companyId) => {
  const response = await axiosClient.patch(`/companies/${companyId}/verify`);
  return response.data;
};
