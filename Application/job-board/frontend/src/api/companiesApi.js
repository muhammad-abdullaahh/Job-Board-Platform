import axiosClient from './axiosClient';

export const fetchCompaniesApi = async (params = {}) => {
  const response = await axiosClient.get('/companies', { params });
  return response.data;
};

export const fetchCompanyDetailApi = async (companyId) => {
  const response = await axiosClient.get(`/companies/${companyId}`);
  return response.data;
};

export const createCompanyApi = async (companyData) => {
  const response = await axiosClient.post('/companies', companyData);
  return response.data;
};

export const updateCompanyApi = async (companyId, companyData) => {
  const response = await axiosClient.put(`/companies/${companyId}`, companyData);
  return response.data;
};

export const renameCompanyApi = async (companyId, newName) => {
  const response = await axiosClient.patch(`/companies/${companyId}/name`, {
    name: newName,
  });
  return response.data;
};

export const deleteCompanyApi = async (companyId) => {
  const response = await axiosClient.delete(`/companies/${companyId}`);
  return response.data;
};
