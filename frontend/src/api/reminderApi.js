import api from './axiosInstance';

export const createReminder = (data) => api.post('/reminders', data);
export const getReminders = (params) => api.get('/reminders', { params });
export const getReminderById = (id) => api.get(`/reminders/${id}`);
export const updateReminder = (id, data) => api.put(`/reminders/${id}`, data);
export const deleteReminder = (id) => api.delete(`/reminders/${id}`);
export const toggleReminderComplete = (id) => api.patch(`/reminders/${id}/complete`);
