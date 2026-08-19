import api from './axiosInstance';

export const getAttachments = (entityType, entityId) => api.get(`/${entityType}s/${entityId}/attachments`);
export const uploadAttachment = (entityType, entityId, formData) => api.post(`/${entityType}s/${entityId}/attachments`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const addLinkAttachment = (entityType, entityId, data) => api.post(`/${entityType}s/${entityId}/attachments/link`, data);
export const deleteAttachment = (entityType, entityId, aid) => api.delete(`/${entityType}s/${entityId}/attachments/${aid}`);
