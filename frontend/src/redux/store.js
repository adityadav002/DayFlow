import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import boardReducer from './slices/boardSlice';
import taskReducer from './slices/taskSlice';
import uiReducer from './slices/uiSlice';
import calendarReducer from './slices/calendarSlice';
import mydayReducer from './slices/mydaySlice';
import workspaceReducer from './slices/workspaceSlice';
import projectReducer from './slices/projectSlice';
import teamReducer from './slices/teamSlice';
import notificationReducer from './slices/notificationSlice';
import meetingReducer from './slices/meetingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    boards: boardReducer,
    tasks: taskReducer,
    ui: uiReducer,
    calendar: calendarReducer,
    myday: mydayReducer,
    workspaces: workspaceReducer,
    projects: projectReducer,
    teams: teamReducer,
    notifications: notificationReducer,
    meeting: meetingReducer,
  },
});
