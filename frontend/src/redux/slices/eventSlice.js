import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as eventApi from '../../api/eventApi';

export const fetchEvents = createAsyncThunk('events/fetchEvents', async (params, { rejectWithValue }) => {
  try {
    const response = await eventApi.getEvents(params);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});

export const createEvent = createAsyncThunk('events/createEvent', async (eventData, { rejectWithValue }) => {
  try {
    const response = await eventApi.createEvent(eventData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create event');
  }
});

export const updateEvent = createAsyncThunk('events/updateEvent', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await eventApi.updateEvent(id, data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update event');
  }
});

export const deleteEvent = createAsyncThunk('events/deleteEvent', async (id, { rejectWithValue }) => {
  try {
    await eventApi.deleteEvent(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
  }
});

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    eventReceivedViaSocket: (state, action) => {
      const newEvent = action.payload;
      const index = state.items.findIndex(e => e._id === newEvent._id);
      if (index !== -1) {
        state.items[index] = newEvent;
      } else {
        state.items.push(newEvent);
      }
    },
    eventRemovedViaSocket: (state, action) => {
      state.items = state.items.filter(e => e._id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        const newEvent = action.payload;
        const index = state.items.findIndex(e => e._id === newEvent._id);
        if (index !== -1) {
          state.items[index] = newEvent;
        } else {
          state.items.push(newEvent);
        }
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.items.findIndex(e => e._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.items = state.items.filter(e => e._id !== action.payload);
      });
  },
});

export const { eventReceivedViaSocket, eventRemovedViaSocket } = eventSlice.actions;
export default eventSlice.reducer;
