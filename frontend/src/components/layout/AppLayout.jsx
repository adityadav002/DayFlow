import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import NotificationBell from '../notifications/NotificationBell';
import useSocket from '../../hooks/useSocket';
import GlobalSearchModal from '../common/GlobalSearchModal';
import IncomingCallOverlay from '../meetings/IncomingCallOverlay';
import PreJoinModal from '../meetings/PreJoinModal';
import ActiveCallModal from '../meetings/ActiveCallModal';

const AppLayout = () => {
  const dispatch = useDispatch();
  
  // Mount global socket connection inside Router context
  useSocket();

  const { socketConnected } = useSelector((state) => state.ui);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    const handleToggleSearch = () => {
      setIsSearchOpen(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('toggle-global-search', handleToggleSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('toggle-global-search', handleToggleSearch);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {!socketConnected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-xs font-semibold animate-pulse shadow-md">
          Connection lost. Reconnecting...
        </div>
      )}
      {/* Sidebar - Desktop & Mobile */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-surface-200 bg-white px-4 md:hidden">
          <div className="flex items-center">
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="mr-4 rounded-md p-2 hover:bg-surface-100 flex items-center justify-center"
            >
              <Menu className="h-5 w-5 text-surface-600" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="font-bold text-white">D</span>
              </div>
              <span className="font-semibold text-surface-900">DayFlow</span>
            </div>
          </div>
          <NotificationBell />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <IncomingCallOverlay />
      <PreJoinModal />
      <ActiveCallModal />
    </div>
  );
};

export default AppLayout;
