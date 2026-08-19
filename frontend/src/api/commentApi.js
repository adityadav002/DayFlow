import api from './axiosInstance';

export const getComments = (taskId, params) => api.get(`/tasks/${taskId}/comments`, { params });
export const addComment = (taskId, data) => api.post(`/tasks/${taskId}/comments`, data);
export const editComment = (taskId, commentId, data) => api.put(`/tasks/${taskId}/comments/${commentId}`, data);
export const deleteComment = (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`);
