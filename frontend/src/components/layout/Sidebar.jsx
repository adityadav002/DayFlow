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

import Avatar from '../common/Avatar';

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
      'relative flex items-center rounded-[10px] px-3 py-2 text-[14px] transition-all duration-200 ease-out z-10',
      isActive
        ? 'bg-[#397D68]/30 text-white font-medium'
        : 'text-white/65 hover:bg-[#397D68]/20 hover:text-white/90'
    );

  const DecorativeLeaves = () => (
    <svg className="absolute bottom-0 left-0 w-full pointer-events-none opacity-[0.08] z-0" viewBox="0 0 240 300" fill="none" xmlns="http://www.w3.org/2500/svg">
      <path d="M-30 320C-10 260 50 180 120 190C190 200 210 120 260 80" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M30 250C40 220 80 210 90 240C70 260 40 270 30 250Z" fill="white" />
      <path d="M120 190C110 150 150 130 170 160C170 190 140 200 120 190Z" fill="white" />
      <path d="M180 140C200 110 240 120 230 150C210 160 180 160 180 140Z" fill="white" />
      <path d="M40 180C60 160 90 170 90 190C70 210 40 200 40 180Z" fill="white" />
    </svg>
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
          'fixed inset-y-0 left-0 z-30 flex w-[240px] flex-col bg-surface-900 transition-transform duration-300 md:relative md:translate-x-0 overflow-hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <DecorativeLeaves />
        
        {/* Logo & Close Button (Mobile) */}
        <div className="flex h-[72px] shrink-0 items-center justify-between px-6 z-10 relative">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 shadow-md">
              <span className="font-bold text-white">D</span>
            </div>
            <span className="text-lg font-bold text-white">DayFlow</span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              className="md:hidden rounded-md p-1 hover:bg-surface-800 flex items-center justify-center"
              onClick={() => dispatch(toggleSidebar())}
            >
              <X className="h-5 w-5 text-surface-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="px-4 py-2 shrink-0 z-10 relative">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 z-10 relative">
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
            <div className="mb-2 flex items-center justify-between px-3 text-[11px] font-medium tracking-[0.06em] text-white/50 uppercase">
              <span>Projects</span>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="rounded hover:bg-white/10 p-0.5 text-white/50 hover:text-white transition-colors"
                title="Create Project"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <NavLink key={project._id} to={`/projects/${project._id}`} className={navItemClass}>
                  <div className="mr-3 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color || '#0ea5e9' }} />
                  <span className="truncate text-[14px]">{project.name}</span>
                </NavLink>
              ))}
              {projects.length === 0 && (
                <div className="px-3 py-2 text-[13px] text-white/40 italic">No projects yet</div>
              )}
            </div>
          </div>

          {/* Boards Section */}
          <div>
            <div className="mb-2 flex items-center justify-between px-3 text-[11px] font-medium tracking-[0.06em] text-white/50 uppercase">
              <span>Your Boards</span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="rounded hover:bg-white/10 p-0.5 text-white/50 hover:text-white transition-colors"
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
                <div className="px-3 py-2 text-[13px] text-white/40 italic">No boards yet</div>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 z-10 relative mt-auto">
          <div 
            className="mb-2 flex items-center px-3 cursor-pointer group hover:bg-white/5 rounded-lg py-2 transition-colors -mx-3"
            onClick={() => navigate('/profile')}
          >
            <Avatar user={user} size="sm" className="group-hover:ring-2 group-hover:ring-primary-500 transition-all shadow-md" />
            <div className="ml-3 overflow-hidden flex-1">
              <p className="truncate text-[14px] font-medium text-white/90 transition-colors">{user?.name}</p>
              <p className="truncate text-[12px] text-white/50">{user?.email}</p>
            </div>
            <div className="text-white/40 group-hover:text-white/70">•••</div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-colors h-9 text-[13px]"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
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
