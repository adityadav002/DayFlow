import api from './axiosInstance';

export const getMyDay = (params) => api.get('/myday', { params });
export const addToMyDay = (data) => api.post('/myday/add', data);
export const removeFromMyDay = (data) => api.delete('/myday/remove', { data });
