import axiosClient from './axiosClient';

export const fetchSkillsApi = async () => {
  const response = await axiosClient.get('/users/skills');
  return response.data;
};

export const createSkillApi = async (name) => {
  const response = await axiosClient.post('/users/skills', { name });
  return response.data;
};
