import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as teamApi from '../../api/teamApi';

export const fetchTeams = createAsyncThunk('teams/fetchTeams', async (workspaceId, { rejectWithValue }) => {
  try {
    const response = await teamApi.getTeams(workspaceId);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch teams');
  }
});

export const createTeam = createAsyncThunk('teams/createTeam', async ({ workspaceId, teamData }, { rejectWithValue }) => {
  try {
    const response = await teamApi.createTeam(workspaceId, teamData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create team');
  }
});

const teamSlice = createSlice({
  name: 'teams',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export default teamSlice.reducer;
