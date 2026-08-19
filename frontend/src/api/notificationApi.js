import api from './axiosInstance';

/**
 * Fetch paginated list of notifications for current user.
 */
export const getNotifications = (params) => api.get('/notifications', { params });

/**
 * Mark a single notification as read.
 */
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`);

/**
 * Mark all user's notifications as read.
 */
export const markAllAsRead = () => api.patch('/notifications/read-all');

/**
 * Delete a single notification.
 */
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
