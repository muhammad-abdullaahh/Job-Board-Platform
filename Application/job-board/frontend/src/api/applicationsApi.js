import axiosClient from './axiosClient';

export const applyToJobApi = async (jobIdOrData, coverLetter) => {
  const payload = typeof jobIdOrData === 'object' 
    ? jobIdOrData 
    : { job_id: jobIdOrData, cover_letter: coverLetter };
  const response = await axiosClient.post('/applications', payload);
  return response.data;
};
export const applyForJobApi = applyToJobApi;

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
