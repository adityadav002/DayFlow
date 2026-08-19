import api from './axiosInstance';

export const getDependencies = (taskId) => api.get(`/tasks/${taskId}/dependencies`);
export const addDependency = (taskId, data) => api.post(`/tasks/${taskId}/dependencies`, data);
export const removeDependency = (taskId, depId) => api.delete(`/tasks/${taskId}/dependencies/${depId}`);
