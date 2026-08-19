import api from './axiosInstance';

export const getWorkspaces = () => api.get('/workspaces');
export const getWorkspaceById = (id) => api.get(`/workspaces/${id}`);
export const createWorkspace = (data) => api.post('/workspaces', data);
export const updateWorkspace = (id, data) => api.put(`/workspaces/${id}`, data);
export const addMember = (workspaceId, data) => api.post(`/workspaces/${workspaceId}/members`, data);
export const removeMember = (workspaceId, userId) => api.delete(`/workspaces/${workspaceId}/members/${userId}`);
export const updateMemberRole = (workspaceId, userId, role) => api.put(`/workspaces/${workspaceId}/members/${userId}/role`, { role });
