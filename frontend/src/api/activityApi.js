import api from './axiosInstance';

export const getTaskActivity = (taskId, params) => api.get(`/tasks/${taskId}/activity`, { params });
