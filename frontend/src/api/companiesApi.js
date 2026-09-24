import axiosClient from './axiosClient';
import { swrFetch, invalidateCache } from './apiCache';

export const fetchCompaniesApi = async (params = {}) => {
  const response = await axiosClient.get('/companies', { params });
  return response.data;
};

export const fetchCompaniesWithCache = async (params = {}, { onData, onError } = {}) => {
  const cacheKey = `companies:${JSON.stringify(params)}`;
  return swrFetch(cacheKey, () => fetchCompaniesApi(params), {
    onData,
    onError,
    freshTtl: 40000,
    maxTtl: 180000,
  });
};

export const fetchCompanyDetailApi = async (companyId) => {
  const response = await axiosClient.get(`/companies/${companyId}`);
  return response.data;
};

export const fetchMyCompanyApi = async () => {
  const response = await axiosClient.get('/companies/me');
  return response.data;
};

export const createCompanyApi = async (companyData) => {
  const response = await axiosClient.post('/companies', companyData);
  invalidateCache('companies');
  return response.data;
};

export const updateCompanyApi = async (companyId, companyData) => {
  const response = await axiosClient.put(`/companies/${companyId}`, companyData);
  invalidateCache('companies');
  invalidateCache('jobs');
  return response.data;
};

export const renameCompanyApi = async (companyId, newName) => {
  const response = await axiosClient.patch(`/companies/${companyId}/name`, {
    name: newName,
  });
  invalidateCache('companies');
  invalidateCache('jobs');
  return response.data;
};

export const deleteCompanyApi = async (companyId) => {
  const response = await axiosClient.delete(`/companies/${companyId}`);
  invalidateCache('companies');
  invalidateCache('jobs');
  return response.data;
};
