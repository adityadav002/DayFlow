import api from './axiosInstance';

export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.patch('/auth/me', data);
export const uploadAvatar = (formData) => api.post('/auth/me/avatar', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const changePassword = (data) => api.patch('/auth/change-password', data);
