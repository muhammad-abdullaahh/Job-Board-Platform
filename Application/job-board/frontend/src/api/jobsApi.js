import axiosClient from './axiosClient';

export const fetchJobsApi = async (params = {}) => {
  const response = await axiosClient.get('/jobs', { params });
  return response.data;
};

export const fetchJobDetailApi = async (jobId) => {
  const response = await axiosClient.get(`/jobs/${jobId}`);
  return response.data;
};

export const createJobApi = async (jobData) => {
  const response = await axiosClient.post('/jobs', jobData);
  return response.data;
};

export const updateJobApi = async (jobId, jobData) => {
  const response = await axiosClient.put(`/jobs/${jobId}`, jobData);
  return response.data;
};

export const deleteJobApi = async (jobId, companyId) => {
  const response = await axiosClient.delete(`/jobs/${jobId}`, {
    params: { company_id: companyId },
  });
  return response.data;
};
