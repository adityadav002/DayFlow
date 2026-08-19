import api from './axiosInstance';

export const getProjectAnalytics = (projectId, params) => {
  return api.get(`/projects/${projectId}/analytics`, { params });
};

export const getTeamAnalytics = (teamId, params) => {
  return api.get(`/teams/${teamId}/analytics`, { params });
};

export const exportProjectAnalyticsCsv = (projectId, params) => {
  return api.get(`/projects/${projectId}/analytics/export`, {
    params,
    responseType: 'blob'
  });
};

export const exportTeamAnalyticsCsv = (teamId, params) => {
  return api.get(`/teams/${teamId}/analytics/export`, {
    params,
    responseType: 'blob'
  });
};
