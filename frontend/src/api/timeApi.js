import api from './axiosInstance';

export const startTimer = (taskId) => api.post(`/tasks/${taskId}/time/timer/start`);
export const pauseTimer = (taskId) => api.post(`/tasks/${taskId}/time/timer/pause`);
export const resumeTimer = (taskId) => api.post(`/tasks/${taskId}/time/timer/resume`);
export const stopTimer = (taskId, data) => api.post(`/tasks/${taskId}/time/timer/stop`, data);
export const getTimerStatus = (taskId) => api.get(`/tasks/${taskId}/time/timer/status`);

export const logManualTime = (taskId, data) => api.post(`/tasks/${taskId}/time/time-entries`, data);
export const getTimeEntries = (taskId) => api.get(`/tasks/${taskId}/time/time-entries`);
export const deleteTimeEntry = (taskId, entryId) => api.delete(`/tasks/${taskId}/time/time-entries/${entryId}`);
