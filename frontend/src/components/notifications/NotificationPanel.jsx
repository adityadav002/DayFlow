import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  removeNotification 
} from '../../redux/slices/notificationSlice';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Trash2, Calendar, UserPlus, CheckSquare, AlertCircle } from 'lucide-react';

const NOTIFICATION_ICONS = {
  TASK_ASSIGNED: <CheckSquare className="h-4 w-4 text-blue-500" />,
  TASK_DEADLINE_SOON: <AlertCircle className="h-4 w-4 text-orange-500" />,
  TASK_OVERDUE: <AlertCircle className="h-4 w-4 text-red-500" />,
  TASK_COMPLETED: <Check className="h-4 w-4 text-green-500" />,
  DEADLINE_CHANGED: <Calendar className="h-4 w-4 text-purple-500" />,
  TEAM_MEMBER_ADDED: <UserPlus className="h-4 w-4 text-green-500" />,
  TEAM_MEMBER_REMOVED: <Trash2 className="h-4 w-4 text-red-500" />,
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: notifications, unreadCount, pagination, status } = useSelector((state) => state.notifications);

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }));
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
  };

  const handleNotifClick = (notif) => {
    if (!notif.isRead) {
      dispatch(markNotificationAsRead(notif._id));
    }
    
    // Support routing using metadata
    if (notif.metadata) {
      // Map format can be a plain object or have get method
      const projectId = notif.metadata.projectId || (typeof notif.metadata.get === 'function' ? notif.metadata.get('projectId') : null);
      const boardId = notif.metadata.boardId || (typeof notif.metadata.get === 'function' ? notif.metadata.get('boardId') : null);
      
      if (projectId) {
        navigate(`/projects/${projectId}`);
      } else if (boardId) {
        navigate(`/b/${boardId}`);
      }
    }
    onClose();
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && status !== 'loading') {
      dispatch(fetchNotifications({ page: pagination.page + 1, limit: 20 }));
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-surface-200 bg-white shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-100 bg-surface-50 px-4 py-3 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-surface-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 focus:outline-none"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-surface-100 custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="h-8 w-8 text-surface-300 mb-2" />
            <p className="text-sm font-medium text-surface-800">All caught up!</p>
            <p className="text-xs text-surface-500 mt-1">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif._id}
              onClick={() => handleNotifClick(notif)}
              className={`flex items-start gap-3 p-4 cursor-pointer transition-colors hover:bg-surface-50 group relative ${
                !notif.isRead ? 'bg-primary-50/20' : ''
              }`}
            >
              {/* Type Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100">
                {NOTIFICATION_ICONS[notif.type] || <Bell className="h-4 w-4 text-surface-500" />}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-xs font-semibold text-surface-900 leading-snug break-words ${
                    !notif.isRead ? 'font-bold text-black' : ''
                  }`}>
                    {notif.title}
                  </p>
                  {!notif.isRead && (
                    <span className="h-2 w-2 rounded-full bg-primary-600 shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-xs text-surface-500 mt-0.5 leading-relaxed break-words">
                  {notif.body}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-surface-400">
                  {notif.actor && (
                    <span className="font-semibold text-surface-600">{notif.actor.name}</span>
                  )}
                  {notif.actor && <span>•</span>}
                  <span>{formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Delete Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(removeNotification(notif._id));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:text-red-500 text-surface-400 p-1 rounded transition-opacity shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}

        {/* Load More */}
        {pagination.page < pagination.pages && (
          <div className="p-3 text-center bg-surface-50/50">
            <button
              disabled={status === 'loading'}
              onClick={handleLoadMore}
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50 focus:outline-none"
            >
              {status === 'loading' ? 'Loading...' : 'Load older notifications'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
