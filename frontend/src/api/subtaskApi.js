import api from './axiosInstance';

export const getSubtasks = (taskId) => api.get(`/tasks/${taskId}/subtasks`);
export const createSubtask = (taskId, data) => api.post(`/tasks/${taskId}/subtasks`, data);
export const updateSubtask = (taskId, subtaskId, data) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
export const completeSubtask = (taskId, subtaskId) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/complete`);
export const deleteSubtask = (taskId, subtaskId) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
