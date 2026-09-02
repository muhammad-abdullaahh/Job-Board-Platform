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

export const toggleUserAdminApi = async (userId, isAdmin) => {
  const response = await axiosClient.patch(`/users/${userId}/role`, { is_admin: isAdmin });
  return response.data;
};

export const fetchAdminAnalyticsApi = async () => {
  const response = await axiosClient.get('/admin/analytics');
  return response.data;
};

export const restoreUserApi = async (userId) => {
  const response = await axiosClient.post(`/users/${userId}/restore`);
  return response.data;
};

export const fetchAdminJobsApi = async (params = {}) => {
  const response = await axiosClient.get('/admin/jobs', { params });
  return response.data;
};

export const updateAdminJobStatusApi = async (jobId, status) => {
  const response = await axiosClient.patch(`/admin/jobs/${jobId}/status`, { status });
  return response.data;
};

export const deleteAdminJobApi = async (jobId) => {
  const response = await axiosClient.delete(`/admin/jobs/${jobId}`);
  return response.data;
};

export const toggleCompanyVerifyApi = async (companyId, isVerified) => {
  const response = await axiosClient.patch(`/companies/${companyId}/verify`, null, {
    params: { is_verified: isVerified }
  });
  return response.data;
};
