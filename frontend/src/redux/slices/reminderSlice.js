import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as reminderApi from '../../api/reminderApi';

export const fetchReminders = createAsyncThunk('reminders/fetchReminders', async (params, { rejectWithValue }) => {
  try {
    const response = await reminderApi.getReminders(params);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch reminders');
  }
});

export const createReminder = createAsyncThunk('reminders/createReminder', async (reminderData, { rejectWithValue }) => {
  try {
    const response = await reminderApi.createReminder(reminderData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create reminder');
  }
});

export const updateReminder = createAsyncThunk('reminders/updateReminder', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await reminderApi.updateReminder(id, data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update reminder');
  }
});

export const toggleReminderComplete = createAsyncThunk('reminders/toggleComplete', async (id, { rejectWithValue }) => {
  try {
    const response = await reminderApi.toggleReminderComplete(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle reminder status');
  }
});

export const deleteReminder = createAsyncThunk('reminders/deleteReminder', async (id, { rejectWithValue }) => {
  try {
    await reminderApi.deleteReminder(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete reminder');
  }
});

const reminderSlice = createSlice({
  name: 'reminders',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    reminderReceivedViaSocket: (state, action) => {
      const newReminder = action.payload;
      const index = state.items.findIndex(r => r._id === newReminder._id);
      if (index !== -1) {
        state.items[index] = newReminder;
      } else {
        state.items.push(newReminder);
      }
    },
    reminderRemovedViaSocket: (state, action) => {
      state.items = state.items.filter(r => r._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        const newReminder = action.payload;
        const index = state.items.findIndex(r => r._id === newReminder._id);
        if (index !== -1) {
          state.items[index] = newReminder;
        } else {
          state.items.push(newReminder);
        }
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        const index = state.items.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(toggleReminderComplete.fulfilled, (state, action) => {
        const index = state.items.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.items = state.items.filter(r => r._id !== action.payload);
      });
  },
});

export const { reminderReceivedViaSocket, reminderRemovedViaSocket } = reminderSlice.actions;
export default reminderSlice.reducer;
