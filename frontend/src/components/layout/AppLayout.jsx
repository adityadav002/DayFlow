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
        {/* Global Header */}
        <header className="flex h-14 items-center justify-between border-b border-surface-200 bg-white px-4 md:px-6 shrink-0 z-40">
          <div className="flex items-center">
            <button 
              onClick={() => dispatch(toggleSidebar())}
              className="mr-4 rounded-md p-2 hover:bg-surface-100 flex items-center justify-center md:hidden"
            >
              <Menu className="h-5 w-5 text-surface-600" />
            </button>
            <div className="flex items-center space-x-2 md:hidden">
              <img src="/dayflow-favicon.svg" alt="DayFlow Logo" className="h-8 w-8" />
              <span className="font-semibold text-surface-900">DayFlow</span>
            </div>
            {/* Desktop spacer */}
            <div className="hidden md:block"></div>
          </div>
          
          <div className="flex items-center space-x-3 md:space-x-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-global-search'))}
              className="hidden md:flex items-center justify-between rounded-full border border-surface-200 bg-surface-50 hover:bg-surface-100 px-4 py-1.5 text-xs text-surface-500 transition-all focus:outline-none w-64"
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2500/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span>Search anywhere...</span>
              </span>
              <kbd className="bg-surface-200 border border-surface-300 px-1.5 py-0.5 rounded text-[10px] text-surface-600 font-mono">Ctrl+K</kbd>
            </button>
            <NotificationBell align="right" />
          </div>
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
