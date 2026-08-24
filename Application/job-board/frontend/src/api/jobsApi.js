import axios from 'axios';

const API_BASE = '/api/v1/jobs';

export const fetchJobsApi = async (params = {}) => {
  const response = await axios.get(API_BASE, { params });
  return response.data;
};

export const fetchJobDetailApi = async (jobId) => {
  const response = await axios.get(`${API_BASE}/${jobId}`);
  return response.data;
};

export const createJobApi = async (jobData, token) => {
  const response = await axios.post(API_BASE, jobData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateJobApi = async (jobId, jobData, token) => {
  const response = await axios.put(`${API_BASE}/${jobId}`, jobData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};
