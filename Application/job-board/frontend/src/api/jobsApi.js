import axiosClient from './axiosClient';
import { swrFetch, invalidateCache } from './apiCache';

export const fetchJobsApi = async (params = {}) => {
  const response = await axiosClient.get('/jobs', { params });
  return response.data;
};

export const fetchJobsWithCache = async (params = {}, { onData, onError } = {}) => {
  const cacheKey = `jobs:${JSON.stringify(params)}`;
  return swrFetch(cacheKey, () => fetchJobsApi(params), {
    onData,
    onError,
    freshTtl: 40000,
    maxTtl: 180000,
  });
};

export const fetchJobDetailApi = async (jobId) => {
  const response = await axiosClient.get(`/jobs/${jobId}`);
  return response.data;
};

export const createJobApi = async (jobData) => {
  const response = await axiosClient.post('/jobs', jobData);
  invalidateCache('jobs');
  return response.data;
};

export const updateJobApi = async (jobId, jobData) => {
  const response = await axiosClient.put(`/jobs/${jobId}`, jobData);
  invalidateCache('jobs');
  return response.data;
};

export const deleteJobApi = async (jobId, companyId) => {
  const response = await axiosClient.delete(`/jobs/${jobId}`, {
    params: { company_id: companyId },
  });
  invalidateCache('jobs');
  return response.data;
};
