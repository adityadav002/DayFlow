import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as notificationApi from '../../api/notificationApi';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getNotifications(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.markAllAsRead();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const removeNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (id, { rejectWithValue }) => {
    try {
      await notificationApi.deleteNotification(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    pagination: { page: 1, pages: 1, total: 0 },
    status: 'idle',
    error: null
  },
  reducers: {
    addIncomingNotification: (state, action) => {
      // Avoid duplicates
      const exists = state.items.some(n => n._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    resetNotificationState: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.pagination = { page: 1, pages: 1, total: 0 };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { notifications, pagination } = action.payload;
        
        if (pagination.page === 1) {
          state.items = notifications;
        } else {
          const existingIds = new Set(state.items.map(n => n._id));
          notifications.forEach(n => {
            if (!existingIds.has(n._id)) {
              state.items.push(n);
            }
          });
        }

        state.pagination = pagination;
        // Compute unread count from items
        state.unreadCount = state.items.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const updated = action.payload;
        const existing = state.items.find(n => n._id === updated._id);
        if (existing) {
          existing.isRead = true;
          existing.readAt = updated.readAt;
        }
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.items.forEach(n => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const existing = state.items.find(n => n._id === id);
        if (existing && !existing.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items = state.items.filter(n => n._id !== id);
      });
  }
});

export const { addIncomingNotification, resetNotificationState } = notificationSlice.actions;
export default notificationSlice.reducer;
