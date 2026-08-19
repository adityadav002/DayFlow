import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as calendarApi from '../../api/calendarApi';

export const fetchCalendarData = createAsyncThunk(
  'calendar/fetchCalendarData',
  async (params, { rejectWithValue }) => {
    try {
      const response = await calendarApi.getCalendar(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch calendar data');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    items: {
      tasks: [],
      events: [],
      reminders: []
    },
    currentView: 'month',
    currentDate: new Date().toISOString(),
    status: 'idle',
    error: null
  },
  reducers: {
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload;
    },
    clearCalendarData: (state) => {
      state.items = { tasks: [], events: [], reminders: [] };
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCalendarData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCalendarData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setCurrentView, setCurrentDate, clearCalendarData } = calendarSlice.actions;
export default calendarSlice.reducer;
