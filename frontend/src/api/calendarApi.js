import api from './axiosInstance';

export const getCalendar = (params) => api.get('/calendar', { params });
