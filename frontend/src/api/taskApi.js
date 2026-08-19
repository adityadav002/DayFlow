import api from './axiosInstance';

export const getTasks = (boardId, params) => api.get(`/tasks/board/${boardId}`, { params });
export const createTask = (boardId, data) => api.post(`/tasks/board/${boardId}`, data);
export const updateTask = (taskId, data) => api.patch(`/tasks/${taskId}`, data);
export const bulkUpdatePositions = (data) => api.patch('/tasks/bulk-positions', data);
export const deleteTask = (taskId, deleteScope) => api.delete(`/tasks/${taskId}`, { params: { deleteScope } });
export const addAttachment = (taskId, formData) => api.post(`/tasks/${taskId}/attachments`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
