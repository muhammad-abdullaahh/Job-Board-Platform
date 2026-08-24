import axios from 'axios';

const API_BASE = '/api/v1/applications';

export const applyToJobApi = async (jobId, coverLetter, token) => {
  const response = await axios.post(
    API_BASE,
    { job_id: jobId, cover_letter: coverLetter },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const fetchMyApplicationsApi = async (token) => {
  const response = await axios.get(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const fetchJobApplicationsApi = async (jobId, token) => {
  const response = await axios.get(`${API_BASE}/job/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updateApplicationStatusApi = async (applicationId, status, token) => {
  const response = await axios.put(
    `${API_BASE}/${applicationId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
