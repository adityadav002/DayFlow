import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import AppLayout from '../components/layout/AppLayout';

// Lazy loading can be added here, for now using regular imports
// We'll replace these with actual components soon
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const BoardPage = React.lazy(() => import('../pages/BoardPage'));
const EventsPage = React.lazy(() => import('../pages/EventsPage'));
const RemindersPage = React.lazy(() => import('../pages/RemindersPage'));
const CalendarPage = React.lazy(() => import('../pages/CalendarPage'));
const MyDayPage = React.lazy(() => import('../pages/MyDayPage'));
const ProjectPage = React.lazy(() => import('../pages/ProjectPage'));
const DashboardView = React.lazy(() => import('../pages/DashboardView'));

const AppRoutes = () => {
  return (
    <React.Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/myday" replace />} />
            <Route path="/myday" element={<MyDayPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/teams/:teamId/dashboard" element={<DashboardView />} />
            <Route path="/b/:boardId" element={<BoardPage />} />
            <Route path="/projects/:projectId" element={<ProjectPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
