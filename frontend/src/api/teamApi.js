import api from './axiosInstance';

export const getTeams = (workspaceId) => api.get(`/workspaces/${workspaceId}/teams`);
export const getTeamById = (workspaceId, teamId) => api.get(`/workspaces/${workspaceId}/teams/${teamId}`);
export const createTeam = (workspaceId, data) => api.post(`/workspaces/${workspaceId}/teams`, data);
export const updateTeam = (workspaceId, teamId, data) => api.put(`/workspaces/${workspaceId}/teams/${teamId}`, data);
export const deleteTeam = (workspaceId, teamId) => api.delete(`/workspaces/${workspaceId}/teams/${teamId}`);
export const addMember = (workspaceId, teamId, data) => api.post(`/workspaces/${workspaceId}/teams/${teamId}/members`, data);
export const removeMember = (workspaceId, teamId, userId) => api.delete(`/workspaces/${workspaceId}/teams/${teamId}/members/${userId}`);
