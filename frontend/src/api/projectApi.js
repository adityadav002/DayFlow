import api from './axiosInstance';

export const getProjects = (params) => api.get('/projects', { params });
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const addMember = (projectId, data) => api.post(`/projects/${projectId}/members`, data);
export const removeMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);
export const updateMemberRole = (projectId, userId, role) => api.put(`/projects/${projectId}/members/${userId}/role`, { role });
export const getProjectTasks = (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params });
