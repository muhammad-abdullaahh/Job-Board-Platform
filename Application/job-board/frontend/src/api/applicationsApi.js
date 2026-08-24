import axiosClient from './axiosClient';

export const applyToJobApi = async (jobId, coverLetter) => {
  const response = await axiosClient.post('/applications', {
    job_id: jobId,
    cover_letter: coverLetter,
  });
  return response.data;
};

export const fetchMyApplicationsApi = async () => {
  const response = await axiosClient.get('/applications/me');
  return response.data;
};

export const fetchJobApplicationsApi = async (jobId) => {
  const response = await axiosClient.get(`/applications/job/${jobId}`);
  return response.data;
};

export const updateApplicationStatusApi = async (applicationId, status) => {
  const response = await axiosClient.put(`/applications/${applicationId}/status`, {
    status,
  });
  return response.data;
};
