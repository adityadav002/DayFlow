import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell } from 'lucide-react';
import NotificationPanel from './NotificationPanel';
import { fetchNotifications } from '../../redux/slices/notificationSlice';

const NotificationBell = ({ align = 'right' }) => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef();
  const { unreadCount } = useSelector((state) => state.notifications);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch initial unread status / count
      dispatch(fetchNotifications({ page: 1, limit: 1 }));
    }
  }, [isAuthenticated, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors focus:outline-none flex items-center justify-center"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white select-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel isOpen={isOpen} onClose={() => setIsOpen(false)} align={align} />
    </div>
  );
};

export default NotificationBell;
