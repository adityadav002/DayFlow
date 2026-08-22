import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { userOnline, userOffline, setSocketConnected, setOnlineUsers } from '../redux/slices/uiSlice';
import { useDispatch, useSelector } from 'react-redux';
import { taskAdded, taskUpdated, taskDeleted, tasksBulkUpdated, commentCountIncremented, commentCountDecremented } from '../redux/slices/taskSlice';
import { fetchProjectById } from '../redux/slices/projectSlice';
import { eventReceivedViaSocket, eventRemovedViaSocket } from '../redux/slices/eventSlice';
import { reminderReceivedViaSocket, reminderRemovedViaSocket } from '../redux/slices/reminderSlice';
import { 
  setIncomingCall, 
  addParticipant, 
  removeParticipant, 
  updateParticipantMediaState, 
  leaveMeeting 
} from '../redux/slices/meetingSlice';
import webrtcService from '../services/webrtcService';
import { addIncomingNotification } from '../redux/slices/notificationSlice';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Global singleton socket connection reference
let globalSocket = null;
let activeListenersCount = 0;

const useSocket = (boardId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { activeMeeting } = useSelector((state) => state.meeting);

  const activeMeetingRef = useRef(activeMeeting);
  useEffect(() => {
    activeMeetingRef.current = activeMeeting;
  }, [activeMeeting]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      return;
    }

    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        withCredentials: true,
        autoConnect: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });
    }

    const socket = globalSocket;
    activeListenersCount++;

    const handleConnect = () => {
      console.log('[SOCKET] Connected to real-time server');
      dispatch(setSocketConnected(true));
      if (boardId) {
        socket.emit('join-board', { boardId });
      }
      if (activeMeetingRef.current) {
        console.log('[SOCKET] Rejoining active meeting room:', activeMeetingRef.current._id);
        socket.emit('meeting:join', { meetingId: activeMeetingRef.current._id });
      }
    };

    const handleDisconnect = (reason) => {
      console.warn('[SOCKET] Disconnected:', reason);
      dispatch(setSocketConnected(false));
    };

    const handleConnectError = (error) => {
      console.error('[SOCKET] Connection error:', error);
      dispatch(setSocketConnected(false));
    };

    // Attach core connection listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // If socket is already connected when hook mounts, trigger join-board
    if (socket.connected) {
      handleConnect();
    }

    // Register all Milestone 7 Events
    
    // 00. NOTIFICATION_CREATED
    const handleNotificationCreated = ({ notification }) => {
      console.log('[SOCKET] NOTIFICATION_CREATED received:', notification);
      dispatch(addIncomingNotification(notification));

      toast.custom((t) => {
        return React.createElement(
          'div',
          {
            onClick: () => {
              toast.dismiss(t.id);
              if (notification.metadata) {
                const projectId = notification.metadata.projectId;
                const boardId = notification.metadata.boardId;
                if (projectId) {
                  navigate(`/projects/${projectId}`);
                } else if (boardId) {
                  navigate(`/b/${boardId}`);
                }
              }
            },
            className: `${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-slate-900 border border-slate-700 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 cursor-pointer hover:bg-slate-800 transition-colors`
          },
          React.createElement(
            'div',
            { className: 'flex-1 w-0' },
            React.createElement(
              'p',
              { className: 'text-sm font-semibold text-white' },
              `🔔 ${notification.title}`
            ),
            React.createElement(
              'p',
              { className: 'mt-1 text-xs text-slate-300' },
              notification.body
            )
          )
        );
      }, { duration: 5000 });
    };

    // 0. Initial presence state
    const handlePresenceInitial = (onlineIds) => {
      console.log('[SOCKET] presence:initial received:', onlineIds);
      dispatch(setOnlineUsers(onlineIds));
    };

    // 1. TASK_CREATED
    const handleTaskCreated = ({ task, projectId, workspaceId }) => {
      console.log('[SOCKET] TASK_CREATED received:', task);
      if (boardId && task.boardId === boardId) {
        dispatch(taskAdded(task));
      }
    };

    // 2. TASK_UPDATED
    const handleTaskUpdated = ({ task, changedFields, projectId, updatedBy }) => {
      console.log('[SOCKET] TASK_UPDATED received:', task);
      if (boardId && task.boardId === boardId) {
        dispatch(taskUpdated(task));
      }

      // Always dispatch window custom event to notify open TaskDetailModal
      const event = new CustomEvent('task:external-update', { detail: { task, changedFields, updatedBy } });
      window.dispatchEvent(event);
    };

    // 3. TASK_STATUS_CHANGED
    const handleTaskStatusChanged = ({ taskId, oldStatus, newStatus, changedBy, projectId }) => {
      console.log('[SOCKET] TASK_STATUS_CHANGED received:', { taskId, oldStatus, newStatus });
    };

    // 4. TASK_DELETED
    const handleTaskDeleted = ({ taskId, projectId }) => {
      console.log('[SOCKET] TASK_DELETED received:', taskId);
      dispatch(taskDeleted({ taskId }));
    };

    // 5. TASK_ASSIGNED
    const handleTaskAssigned = ({ task, assignedTo, assignedBy, projectId }) => {
      console.log('[SOCKET] TASK_ASSIGNED received:', task);
      if (assignedTo === user?._id && assignedBy !== user?._id) {
        toast.success(`You have been assigned a new task: "${task.title}"`);
      }
      if (boardId && task.boardId === boardId) {
        dispatch(taskUpdated(task));
      }
    };

    // 6. PROJECT_UPDATED
    const handleProjectUpdated = ({ project, changedFields }) => {
      console.log('[SOCKET] PROJECT_UPDATED received:', project);
      dispatch(fetchProjectById(project._id));
    };

    // 7. TEAM_MEMBER_ADDED
    const handleTeamMemberAdded = ({ user: addedUser, projectId, addedBy }) => {
      console.log('[SOCKET] TEAM_MEMBER_ADDED received:', addedUser);
      dispatch(fetchProjectById(projectId));
      if (addedUser._id === user?._id) {
        toast.success('You have been added to a new project!');
      }
    };

    // 8. TEAM_MEMBER_REMOVED
    const handleTeamMemberRemoved = ({ userId: removedUserId, projectId, removedBy }) => {
      console.log('[SOCKET] TEAM_MEMBER_REMOVED received:', removedUserId);
      dispatch(fetchProjectById(projectId));
      if (removedUserId === user?._id) {
        toast.error('You have been removed from the project.');
      }
    };

    // 9. USER_ONLINE
    const handleUserOnline = ({ userId, projectId }) => {
      console.log('[SOCKET] USER_ONLINE:', userId);
      dispatch(userOnline(userId));
    };

    // 10. USER_OFFLINE
    const handleUserOffline = ({ userId, projectId }) => {
      console.log('[SOCKET] USER_OFFLINE:', userId);
      dispatch(userOffline(userId));
    };

    // 11. COMMENT_CREATED
    const handleCommentCreated = ({ comment, taskId, projectId }) => {
      console.log('[SOCKET] COMMENT_CREATED received:', { comment, taskId });
      dispatch(commentCountIncremented({ taskId }));
      const event = new CustomEvent('comment:created', { detail: { comment, taskId, projectId } });
      window.dispatchEvent(event);
    };

    // 12. COMMENT_UPDATED
    const handleCommentUpdated = ({ comment, taskId, projectId }) => {
      console.log('[SOCKET] COMMENT_UPDATED received:', { comment, taskId });
      const event = new CustomEvent('comment:updated', { detail: { comment, taskId, projectId } });
      window.dispatchEvent(event);
    };

    // 13. COMMENT_DELETED
    const handleCommentDeleted = ({ commentId, taskId, projectId }) => {
      console.log('[SOCKET] COMMENT_DELETED received:', { commentId, taskId });
      dispatch(commentCountDecremented({ taskId }));
      const event = new CustomEvent('comment:deleted', { detail: { commentId, taskId, projectId } });
      window.dispatchEvent(event);
    };

    // 14. CHAT_MESSAGE
    const handleChatMessage = (msg) => {
      console.log('[SOCKET] chat:message received:', msg);
      const event = new CustomEvent('chat:message', { detail: msg });
      window.dispatchEvent(event);
    };

    // 15. EVENTS
    const handleEventCreated = (event) => {
      console.log('[SOCKET] EVENT_CREATED received:', event);
      dispatch(eventReceivedViaSocket(event));
    };
    const handleEventUpdated = (event) => {
      console.log('[SOCKET] EVENT_UPDATED received:', event);
      dispatch(eventReceivedViaSocket(event));
    };
    const handleEventDeleted = (eventId) => {
      console.log('[SOCKET] EVENT_DELETED received:', eventId);
      dispatch(eventRemovedViaSocket(eventId));
    };

    // 16. REMINDERS
    const handleReminderCreated = (reminder) => {
      console.log('[SOCKET] REMINDER_CREATED received:', reminder);
      dispatch(reminderReceivedViaSocket(reminder));
    };
    const handleReminderUpdated = (reminder) => {
      console.log('[SOCKET] REMINDER_UPDATED received:', reminder);
      dispatch(reminderReceivedViaSocket(reminder));
    };
    const handleReminderDeleted = (reminderId) => {
      console.log('[SOCKET] REMINDER_DELETED received:', reminderId);
      dispatch(reminderRemovedViaSocket(reminderId));
    };

    // Compatibility support for legacy board event listeners
    const handleLegacyTaskCreated = (task) => {
      if (boardId && task.boardId === boardId) {
        dispatch(taskAdded(task));
      }
    };
    const handleLegacyTaskUpdated = (task) => {
      if (boardId && task.boardId === boardId) {
        dispatch(taskUpdated(task));
      }
    };
    const handleLegacyTaskDeleted = ({ taskId }) => {
      dispatch(taskDeleted({ taskId }));
    };
    const handleLegacyTaskBulkUpdated = (tasks) => {
      dispatch(tasksBulkUpdated(tasks));
    };

    socket.on('NOTIFICATION_CREATED', handleNotificationCreated);
    socket.on('presence:initial', handlePresenceInitial);
    socket.on('TASK_CREATED', handleTaskCreated);
    socket.on('TASK_UPDATED', handleTaskUpdated);
    socket.on('TASK_STATUS_CHANGED', handleTaskStatusChanged);
    socket.on('TASK_DELETED', handleTaskDeleted);
    socket.on('TASK_ASSIGNED', handleTaskAssigned);
    socket.on('PROJECT_UPDATED', handleProjectUpdated);
    socket.on('TEAM_MEMBER_ADDED', handleTeamMemberAdded);
    socket.on('TEAM_MEMBER_REMOVED', handleTeamMemberRemoved);
    socket.on('USER_ONLINE', handleUserOnline);
    socket.on('USER_OFFLINE', handleUserOffline);
    socket.on('COMMENT_CREATED', handleCommentCreated);
    socket.on('COMMENT_UPDATED', handleCommentUpdated);
    socket.on('COMMENT_DELETED', handleCommentDeleted);
    socket.on('chat:message', handleChatMessage);

    socket.on('EVENT_CREATED', handleEventCreated);
    socket.on('EVENT_UPDATED', handleEventUpdated);
    socket.on('EVENT_DELETED', handleEventDeleted);
    
    socket.on('REMINDER_CREATED', handleReminderCreated);
    socket.on('REMINDER_UPDATED', handleReminderUpdated);
    socket.on('REMINDER_DELETED', handleReminderDeleted);

    socket.on('task:created', handleLegacyTaskCreated);
    socket.on('task:updated', handleLegacyTaskUpdated);
    socket.on('task:deleted', handleLegacyTaskDeleted);
    socket.on('task:bulk-updated', handleLegacyTaskBulkUpdated);

    // Meeting / Call Events
    const handleMeetingInvitation = (data) => {
      console.log('[SOCKET] meeting:invitation:', data);
      dispatch(setIncomingCall({ ...data, caller: data.host }));
    };
    const handleMeetingUserJoined = (data) => {
      console.log('[SOCKET] meeting:user_joined:', data);
      dispatch(addParticipant(data));
      // If we are already connected to the meeting, we act as initiator to the new peer
      if (webrtcService.meetingId) {
        console.log('[WEBRTC] Initiating connection to new peer:', data.userId);
        webrtcService.connectToPeer(data.userId, true);
      }
    };
    const handleMeetingUserLeft = (data) => {
      console.log('[SOCKET] meeting:user_left:', data);
      dispatch(removeParticipant(data));
    };
    const handleMeetingMediaStateChanged = (data) => {
      dispatch(updateParticipantMediaState(data));
    };
    const handleMeetingEnded = (data) => {
      console.log('[SOCKET] meeting:ended:', data);
      dispatch(leaveMeeting());
    };

    socket.on('meeting:invitation', handleMeetingInvitation);
    socket.on('meeting:user_joined', handleMeetingUserJoined);
    socket.on('meeting:user_left', handleMeetingUserLeft);
    socket.on('meeting:media_state_changed', handleMeetingMediaStateChanged);
    socket.on('meeting:ended', handleMeetingEnded);

    return () => {
      activeListenersCount--;
      
      // Clean up listeners
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);

      socket.off('NOTIFICATION_CREATED', handleNotificationCreated);
      socket.off('presence:initial', handlePresenceInitial);
      socket.off('TASK_CREATED', handleTaskCreated);
      socket.off('TASK_UPDATED', handleTaskUpdated);
      socket.off('TASK_STATUS_CHANGED', handleTaskStatusChanged);
      socket.off('TASK_DELETED', handleTaskDeleted);
      socket.off('TASK_ASSIGNED', handleTaskAssigned);
      socket.off('PROJECT_UPDATED', handleProjectUpdated);
      socket.off('TEAM_MEMBER_ADDED', handleTeamMemberAdded);
      socket.off('TEAM_MEMBER_REMOVED', handleTeamMemberRemoved);
      socket.off('USER_ONLINE', handleUserOnline);
      socket.off('USER_OFFLINE', handleUserOffline);
      socket.off('COMMENT_CREATED', handleCommentCreated);
      socket.off('COMMENT_UPDATED', handleCommentUpdated);
      socket.off('COMMENT_DELETED', handleCommentDeleted);
      socket.off('chat:message', handleChatMessage);

      socket.off('EVENT_CREATED', handleEventCreated);
      socket.off('EVENT_UPDATED', handleEventUpdated);
      socket.off('EVENT_DELETED', handleEventDeleted);
      
      socket.off('REMINDER_CREATED', handleReminderCreated);
      socket.off('REMINDER_UPDATED', handleReminderUpdated);
      socket.off('REMINDER_DELETED', handleReminderDeleted);

      socket.off('task:created', handleLegacyTaskCreated);
      socket.off('task:updated', handleLegacyTaskUpdated);
      socket.off('task:deleted', handleLegacyTaskDeleted);
      socket.off('task:bulk-updated', handleLegacyTaskBulkUpdated);

      socket.off('meeting:invitation', handleMeetingInvitation);
      socket.off('meeting:user_joined', handleMeetingUserJoined);
      socket.off('meeting:user_left', handleMeetingUserLeft);
      socket.off('meeting:media_state_changed', handleMeetingMediaStateChanged);
      socket.off('meeting:ended', handleMeetingEnded);

      if (boardId) {
        socket.emit('leave-board', { boardId });
      }

      if (activeListenersCount === 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, [boardId, isAuthenticated, dispatch, user?._id]);

  const emitEvent = (eventName, data) => {
    if (globalSocket && globalSocket.connected) {
      globalSocket.emit(eventName, data);
    }
  };

  return { emitEvent, socket: globalSocket };
};

export default useSocket;
