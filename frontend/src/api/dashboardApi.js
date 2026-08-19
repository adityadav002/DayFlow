import api from './axiosInstance';

export const getTeamDashboard = (teamId, params) => {
  return api.get(`/teams/${teamId}/dashboard`, { params });
};

export const getMemberTasks = (teamId, userId) => {
  return api.get(`/teams/${teamId}/members/${userId}/tasks`);
};
