import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as workspaceApi from '../../api/workspaceApi';

export const fetchWorkspaces = createAsyncThunk('workspaces/fetchWorkspaces', async (_, { rejectWithValue }) => {
  try {
    const response = await workspaceApi.getWorkspaces();
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspaces');
  }
});

export const createWorkspace = createAsyncThunk('workspaces/createWorkspace', async (workspaceData, { rejectWithValue }) => {
  try {
    const response = await workspaceApi.createWorkspace(workspaceData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create workspace');
  }
});

export const fetchWorkspaceById = createAsyncThunk('workspaces/fetchWorkspaceById', async (id, { rejectWithValue }) => {
  try {
    const response = await workspaceApi.getWorkspaceById(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch workspace details');
  }
});

export const addMemberToWorkspace = createAsyncThunk('workspaces/addMember', async ({ workspaceId, email }, { rejectWithValue }) => {
  try {
    const response = await workspaceApi.addMember(workspaceId, { email });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add member to workspace');
  }
});

export const removeMemberFromWorkspace = createAsyncThunk('workspaces/removeMember', async ({ workspaceId, userId }, { rejectWithValue }) => {
  try {
    const response = await workspaceApi.removeMember(workspaceId, userId);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove member from workspace');
  }
});

export const updateWorkspaceMemberRole = createAsyncThunk('workspaces/updateMemberRole', async ({ workspaceId, userId, role }, { rejectWithValue }) => {
  try {
    const response = await workspaceApi.updateMemberRole(workspaceId, userId, role);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update member role');
  }
});

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState: {
    items: [],
    currentWorkspace: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        // Default to personal workspace or first workspace if not set
        if (!state.currentWorkspace && action.payload.length > 0) {
          const personal = action.payload.find(w => w.isPersonal);
          state.currentWorkspace = personal || action.payload[0];
        }
      })
      .addCase(fetchWorkspaces.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.currentWorkspace = action.payload;
      })
      .addCase(fetchWorkspaceById.fulfilled, (state, action) => {
        state.currentWorkspace = action.payload;
      })
      .addCase(addMemberToWorkspace.fulfilled, (state, action) => {
        if (state.currentWorkspace && state.currentWorkspace._id === action.payload._id) {
          state.currentWorkspace = action.payload;
        }
        const index = state.items.findIndex(w => w._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(removeMemberFromWorkspace.fulfilled, (state, action) => {
        if (state.currentWorkspace && state.currentWorkspace._id === action.payload._id) {
          state.currentWorkspace = action.payload;
        }
        const index = state.items.findIndex(w => w._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateWorkspaceMemberRole.fulfilled, (state, action) => {
        if (state.currentWorkspace && state.currentWorkspace._id === action.payload._id) {
          state.currentWorkspace = action.payload;
        }
        const index = state.items.findIndex(w => w._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { setCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
