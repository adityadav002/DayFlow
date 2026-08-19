import api from './axiosInstance';

export const getBoards = () => api.get('/boards');
export const getBoardById = (id) => api.get(`/boards/${id}`);
export const createBoard = (data) => api.post('/boards', data);
export const updateBoard = (id, data) => api.patch(`/boards/${id}`, data);
export const deleteBoard = (id) => api.delete(`/boards/${id}`);
export const addMember = (boardId, data) => api.post(`/boards/${boardId}/members`, data);
export const removeMember = (boardId, userId) => api.delete(`/boards/${boardId}/members/${userId}`);
export const getBoardActivity = (boardId, params) => api.get(`/activities/board/${boardId}`, { params });
