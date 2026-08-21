import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, Home, X, Plus, Users, Settings, Calendar, Bell, Sun, Search, BarChart2, MessageSquare } from 'lucide-react';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { logoutUser } from '../../redux/slices/authSlice';
import { fetchProjects } from '../../redux/slices/projectSlice';
import { fetchTeams } from '../../redux/slices/teamSlice';
import { cn } from '../../utils/helpers';
import Button from '../common/Button';
import CreateBoardModal from '../boards/CreateBoardModal';
import CreateProjectModal from '../projects/CreateProjectModal';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import NotificationBell from '../notifications/NotificationBell';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  const { items: boards } = useSelector((state) => state.boards);
  const { currentWorkspace } = useSelector((state) => state.workspaces);
  const { items: projects } = useSelector((state) => state.projects);
  const { items: teams } = useSelector((state) => state.teams);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      dispatch(fetchProjects({ workspace: currentWorkspace._id }));
      dispatch(fetchTeams(currentWorkspace._id));
    }
  }, [dispatch, currentWorkspace]);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    cn(
      'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
    );

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-surface-200 bg-white transition-transform duration-300 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo & Close Button (Mobile) */}
        <div className="flex h-14 items-center justify-between border-b border-surface-200 px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <span className="font-bold text-white">D</span>
            </div>
            <span className="text-lg font-bold text-surface-900">DayFlow</span>
          </div>
          <div className="flex items-center space-x-1">
            <NotificationBell />
            <button
              className="md:hidden rounded-md p-1 hover:bg-surface-100 flex items-center justify-center"
              onClick={() => dispatch(toggleSidebar())}
            >
              <X className="h-5 w-5 text-surface-500" />
            </button>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 py-3 border-b border-surface-200">
          <WorkspaceSwitcher />
        </div>

        {/* Search trigger */}
        <div className="px-4 py-2 border-b border-surface-200">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-global-search'))}
            className="w-full flex items-center justify-between rounded-lg border border-surface-300 bg-surface-50 hover:bg-surface-100 hover:border-surface-400 px-3 py-1.5 text-xs text-surface-500 font-medium transition-all shadow-sm cursor-pointer focus:outline-none"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-surface-400" />
              <span>Search...</span>
            </span>
            <kbd className="bg-white border border-surface-250 px-1 py-0.5 rounded text-[10px] text-surface-400 font-mono shadow-sm">Ctrl+K</kbd>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div className="space-y-1">
            <NavLink to="/myday" className={navItemClass}>
              <Sun className="mr-3 h-5 w-5 animate-pulse text-amber-500" />
              My Day
            </NavLink>
            <NavLink to="/messages" className={navItemClass}>
              <MessageSquare className="mr-3 h-5 w-5" />
              Messages
            </NavLink>
            <NavLink to="/dashboard" className={navItemClass}>
              <Home className="mr-3 h-5 w-5" />
              Dashboard
            </NavLink>
            {teams && teams.length > 0 && (
              <NavLink to={`/teams/${teams[0]._id}/dashboard`} className={navItemClass}>
                <BarChart2 className="mr-3 h-5 w-5" />
                Team Dashboard
              </NavLink>
            )}
            <NavLink to="/calendar" className={navItemClass}>
              <Calendar className="mr-3 h-5 w-5" />
              Calendar
            </NavLink>
            <NavLink to="/events" className={navItemClass}>
              <Calendar className="mr-3 h-5 w-5" />
              Events Stub
            </NavLink>
            <NavLink to="/reminders" className={navItemClass}>
              <Bell className="mr-3 h-5 w-5" />
              Reminders Stub
            </NavLink>
          </div>

          {/* Projects Section */}
          <div>
            <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
              <span>Projects</span>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="rounded hover:bg-surface-200 p-0.5 text-surface-500 hover:text-surface-900 transition-colors"
                title="Create Project"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <NavLink key={project._id} to={`/projects/${project._id}`} className={navItemClass}>
                  <div className="mr-3 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color || '#0ea5e9' }} />
                  <span className="truncate text-sm font-medium">{project.name}</span>
                </NavLink>
              ))}
              {projects.length === 0 && (
                <div className="px-3 py-2 text-xs text-surface-400 italic">No projects yet</div>
              )}
            </div>
          </div>

          {/* Boards Section */}
          <div>
            <div className="mb-2 flex items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
              <span>Your Boards</span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded hover:bg-surface-200 p-0.5 text-surface-500 hover:text-surface-900 transition-colors"
                title="Create Board"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {boards.map((board) => (
                <NavLink key={board._id} to={`/b/${board._id}`} className={navItemClass}>
                  <div className="mr-3 h-2 w-2 rounded-full" style={{ backgroundColor: board.color || '#0ea5e9' }} />
                  <span className="truncate">{board.title}</span>
                </NavLink>
              ))}
              {boards.length === 0 && (
                <div className="px-3 py-2 text-sm text-surface-400 italic">No boards yet</div>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-surface-200 p-4">
          <div className="mb-4 flex items-center px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold uppercase">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="truncate text-sm font-medium text-surface-900">{user?.name}</p>
              <p className="truncate text-xs text-surface-500">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Modals */}
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
