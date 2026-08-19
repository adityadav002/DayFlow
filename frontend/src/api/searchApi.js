import api from './axiosInstance';

export const searchGlobal = (query, workspaceId) => api.get('/search', { params: { q: query, workspaceId } });
export const suggestTags = (query) => api.get('/tags/suggest', { params: { q: query } });
