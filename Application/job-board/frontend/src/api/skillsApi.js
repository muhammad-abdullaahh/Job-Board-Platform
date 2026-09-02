import axiosClient from './axiosClient';

export const fetchSkillsApi = async () => {
  const response = await axiosClient.get('/users/skills');
  return response.data;
};

export const createSkillApi = async (name) => {
  const response = await axiosClient.post('/users/skills', { name });
  return response.data;
};

export const updateSkillApi = async (skillId, name) => {
  const response = await axiosClient.put(`/users/skills/${skillId}`, { name });
  return response.data;
};

export const deleteSkillApi = async (skillId) => {
  const response = await axiosClient.delete(`/users/skills/${skillId}`);
  return response.data;
};
