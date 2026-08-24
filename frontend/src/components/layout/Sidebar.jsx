import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Home, X, Plus, Calendar, Ticket, Bell, Sun, Search, BarChart2, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { fetchProjects } from '../../redux/slices/projectSlice';
import { fetchTeams } from '../../redux/slices/teamSlice';
import { fetchBoards } from '../../redux/slices/boardSlice';
import { cn } from '../../utils/helpers';
import Button from '../common/Button';
import CreateBoardModal from '../boards/CreateBoardModal';
import CreateProjectModal from '../projects/CreateProjectModal';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import Avatar from '../common/Avatar';

// Portal Tooltip for collapsed state to avoid clipping
const PortalTooltip = ({ text, rect }) => {
  if (!rect || !text) return null;
  return createPortal(
    <div 
      className="fixed z-[100] rounded bg-[#18243A] border border-surface-700 px-3 py-1.5 text-[13px] font-medium text-white shadow-xl pointer-events-none animate-in fade-in slide-in-from-left-1 duration-200"
      style={{ top: rect.top + rect.height / 2, left: rect.right + 16, transform: 'translateY(-50%)' }}
    >
      {text}
      <div className="absolute top-1/2 -left-1 w-2 h-2 bg-[#18243A] border-l border-b border-surface-700 transform -translate-y-1/2 rotate-45"></div>
    </div>,
    document.body
  );
};

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
  
  // Collapse State
  const [isCollapsedState, setIsCollapsedState] = useState(() => {
    return localStorage.getItem('dayflow-sidebar-collapsed') === 'true';
  });
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCollapsed = isCollapsedState && !isMobile;

  // Tooltip State
  const [tooltipData, setTooltipData] = useState({ text: null, rect: null });

  useEffect(() => {
    localStorage.setItem('dayflow-sidebar-collapsed', isCollapsedState.toString());
  }, [isCollapsedState]);

  useEffect(() => {
    if (currentWorkspace) {
      dispatch(fetchProjects({ workspace: currentWorkspace._id }));
      dispatch(fetchTeams(currentWorkspace._id));
      dispatch(fetchBoards());
    }
  }, [dispatch, currentWorkspace]);

  const navItemClass = ({ isActive }) =>
    cn(
      'relative flex items-center transition-all duration-200 ease-out z-10 group',
      isCollapsed ? 'justify-center w-8 h-8 mx-auto rounded-md' : 'px-3 py-2 rounded-xl',
      isActive
        ? (isCollapsed 
            ? 'bg-[#397D68]/20 text-[#397D68]' 
            : 'bg-[#397D68]/20 text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:bg-[#397D68] before:rounded-r-full')
        : 'text-white/60 hover:bg-white/5 hover:text-white'
    );

  const handleMouseEnter = (e, text) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipData({ text, rect });
  };

  const handleMouseLeave = () => {
    setTooltipData({ text: null, rect: null });
  };

  // Shared NavItem component for easier tooltip handling
  const NavItem = ({ to, icon: Icon, label, iconColor }) => (
    <NavLink 
      to={to} 
      className={navItemClass}
      onMouseEnter={(e) => handleMouseEnter(e, label)}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className={cn("shrink-0 transition-colors", isCollapsed ? "h-[18px] w-[18px]" : "mr-3 h-5 w-5", iconColor)} />
      {!isCollapsed && <span className="text-[14px] truncate">{label}</span>}
    </NavLink>
  );

  return (
    <>
      <PortalTooltip text={tooltipData.text} rect={tooltipData.rect} />

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
          'fixed inset-y-0 left-0 z-30 flex flex-col bg-[#18243A] transition-all duration-300 md:relative border-r border-surface-800',
          'w-[260px] -translate-x-full md:translate-x-0', // Default mobile hidden, desktop visible
          sidebarOpen && 'translate-x-0 w-[260px]', // Mobile open overrides
          !sidebarOpen && isCollapsed && 'md:w-[72px]', // Desktop collapsed
          !sidebarOpen && !isCollapsed && 'md:w-[260px]' // Desktop expanded
        )}
      >
        {/* Decorative Background for Expanded Mode */}
        {!isCollapsed && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
             <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[#397D68] blur-[80px] rounded-full mix-blend-screen"></div>
          </div>
        )}
        
        {/* Header (Logo & Collapse Toggle) */}
        <div className={cn("flex h-[72px] shrink-0 items-center z-10 relative transition-all", isCollapsed ? "justify-center" : "justify-between px-5")}>
          <div 
            className="flex items-center overflow-hidden group/logo relative cursor-pointer" 
            onClick={() => isCollapsed && setIsCollapsedState(false)}
            onMouseEnter={(e) => isCollapsed && handleMouseEnter(e, "Expand sidebar")}
            onMouseLeave={handleMouseLeave}
          >
            {isCollapsed ? (
              <div className="relative h-8 w-8 flex items-center justify-center">
                <img src="/dayflow-favicon.svg" alt="DayFlow Logo" className="h-7 w-7 shrink-0 transition-opacity duration-200 group-hover/logo:opacity-0" />
                <PanelLeftOpen className="h-[22px] w-[22px] absolute text-white/70 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-200" />
              </div>
            ) : (
              <>
                <img src="/dayflow-favicon.svg" alt="DayFlow Logo" className="h-8 w-8 shrink-0 mr-2" />
                <span className="text-[18px] font-bold text-white whitespace-nowrap animate-in fade-in">DayFlow</span>
              </>
            )}
          </div>
          
          {/* Desktop Close Button (Only when expanded) */}
          {!isCollapsed && (
             <button
                className="hidden md:flex rounded-md p-1.5 hover:bg-white/10 items-center justify-center text-white/50 hover:text-white transition-colors"
                onClick={() => setIsCollapsedState(true)}
                onMouseEnter={(e) => handleMouseEnter(e, "Close sidebar")}
                onMouseLeave={handleMouseLeave}
             >
                <PanelLeftClose className="h-5 w-5" />
             </button>
          )}

          {/* Mobile Close Button */}
          <button
            className="md:hidden rounded-md p-2 hover:bg-white/10 flex items-center justify-center text-white/50"
            onClick={() => dispatch(toggleSidebar())}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className={cn("py-2 shrink-0 z-10 relative", isCollapsed ? "px-2" : "px-4")}>
          <WorkspaceSwitcher isCollapsed={isCollapsed} />
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-3 space-y-7 z-10 relative">
          
          <div className="space-y-2">
            <NavItem to="/myday" icon={Sun} label="My Day" iconColor="text-amber-500 group-hover:text-amber-400" />
            <NavItem to="/messages" icon={MessageSquare} label="Messages" />
            <NavItem to="/dashboard" icon={Home} label="Dashboard" />
            {teams && teams.length > 0 && (
              <NavItem to={`/teams/${teams[0]._id}/dashboard`} icon={BarChart2} label="Team Dashboard" />
            )}
            <NavItem to="/calendar" icon={Calendar} label="Calendar" />
            <NavItem to="/events" icon={Ticket} label="Events" />
            <NavItem to="/reminders" icon={Bell} label="Reminders" />
          </div>

          {/* Projects Section */}
          <div>
            {!isCollapsed && (
              <div className="mb-3 flex items-center justify-between px-3 text-[11px] font-semibold tracking-wider text-[#B8A58C] uppercase animate-in fade-in">
                <span>Projects</span>
                <button onClick={() => setIsProjectModalOpen(true)} className="rounded hover:bg-white/10 p-0.5 text-[#B8A58C] hover:text-white transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className={cn("transition-all", isCollapsed ? "space-y-3 mt-6" : "space-y-1.5")}>
              {projects.map((project) => (
                <NavLink 
                  key={project._id} 
                  to={`/projects/${project._id}`} 
                  className={navItemClass}
                  onMouseEnter={(e) => handleMouseEnter(e, project.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className={cn("rounded-full shrink-0 transition-transform group-hover:scale-125", isCollapsed ? "h-3 w-3" : "mr-3 h-2.5 w-2.5")} style={{ backgroundColor: project.color || '#397D68' }} />
                  {!isCollapsed && <span className="truncate text-[14px] font-medium">{project.name}</span>}
                </NavLink>
              ))}
              {projects.length === 0 && !isCollapsed && (
                <div className="px-3 py-2 text-[13px] text-white/40 italic">No projects yet</div>
              )}
            </div>
          </div>

          {/* Boards Section */}
          <div>
            {!isCollapsed && (
              <div className="mb-3 flex items-center justify-between px-3 text-[11px] font-semibold tracking-wider text-[#B8A58C] uppercase animate-in fade-in">
                <span>Boards</span>
                <button onClick={() => setIsCreateModalOpen(true)} className="rounded hover:bg-white/10 p-0.5 text-[#B8A58C] hover:text-white transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className={cn("transition-all", isCollapsed ? "space-y-3 mt-6" : "space-y-1.5")}>
              {boards.map((board) => (
                <NavLink 
                  key={board._id} 
                  to={`/b/${board._id}`} 
                  className={navItemClass}
                  onMouseEnter={(e) => handleMouseEnter(e, board.title)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className={cn("rounded-sm shrink-0 transition-transform group-hover:scale-125", isCollapsed ? "h-3 w-3" : "mr-3 h-2 w-2")} style={{ backgroundColor: board.color || '#B8A58C' }} />
                  {!isCollapsed && <span className="truncate text-[14px] font-medium">{board.title}</span>}
                </NavLink>
              ))}
              {boards.length === 0 && !isCollapsed && (
                <div className="px-3 py-2 text-[13px] text-white/40 italic">No boards yet</div>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 z-10 relative mt-auto border-t border-surface-800 bg-[#18243A]">
          <div 
            className={cn("flex items-center cursor-pointer group hover:bg-white/5 rounded-xl transition-colors", isCollapsed ? "justify-center p-0 w-8 h-8 mx-auto" : "px-3 py-2.5")}
            onClick={() => navigate('/profile')}
            onMouseEnter={(e) => handleMouseEnter(e, user?.name || 'Profile')}
            onMouseLeave={handleMouseLeave}
          >
            <Avatar user={user} size={isCollapsed ? "sm" : "md"} className="group-hover:ring-2 group-hover:ring-[#397D68] transition-all shadow-md shrink-0" />
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden text-left flex-1">
                <p className="truncate text-sm font-semibold text-white group-hover:text-white transition-colors">{user?.name || 'User'}</p>
                <p className="truncate text-[12px] text-white/40">{user?.email || 'user@example.com'}</p>
              </div>
            )}
          </div>
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
