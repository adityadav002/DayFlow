import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as mydayApi from '../../api/mydayApi';

export const fetchMyDay = createAsyncThunk(
  'myday/fetchMyDay',
  async (date, { rejectWithValue }) => {
    try {
      const response = await mydayApi.getMyDay({ date });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch My Day');
    }
  }
);

export const addTaskToMyDay = createAsyncThunk(
  'myday/addTaskToMyDay',
  async ({ taskId, date }, { rejectWithValue }) => {
    try {
      const response = await mydayApi.addToMyDay({ taskId, date });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to pin task to My Day');
    }
  }
);

export const removeTaskFromMyDay = createAsyncThunk(
  'myday/removeTaskFromMyDay',
  async ({ taskId, date }, { rejectWithValue }) => {
    try {
      const response = await mydayApi.removeFromMyDay({ taskId, date });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unpin task from My Day');
    }
  }
);

const mydaySlice = createSlice({
  name: 'myday',
  initialState: {
    date: new Date().toISOString().split('T')[0],
    timeline: [],
    overdue: [],
    tomorrow: [],
    summary: {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0,
      overdue: 0
    },
    status: 'idle',
    error: null
  },
  reducers: {
    setMyDayDate: (state, action) => {
      state.date = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyDay.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyDay.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.timeline = action.payload.timeline;
        state.overdue = action.payload.overdue;
        state.tomorrow = action.payload.tomorrow;
        state.summary = action.payload.summary;
      })
      .addCase(fetchMyDay.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setMyDayDate } = mydaySlice.actions;
export default mydaySlice.reducer;
