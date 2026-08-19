import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as projectApi from '../../api/projectApi';

export const fetchProjects = createAsyncThunk('projects/fetchProjects', async (params, { rejectWithValue }) => {
  try {
    const response = await projectApi.getProjects(params);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
  }
});

export const createProject = createAsyncThunk('projects/createProject', async (projectData, { rejectWithValue }) => {
  try {
    const response = await projectApi.createProject(projectData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create project');
  }
});

export const fetchProjectById = createAsyncThunk('projects/fetchProjectById', async (id, { rejectWithValue }) => {
  try {
    const response = await projectApi.getProjectById(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch project details');
  }
});

export const addMemberToProject = createAsyncThunk('projects/addMember', async ({ projectId, email }, { rejectWithValue }) => {
  try {
    const response = await projectApi.addMember(projectId, { email });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add member to project');
  }
});

export const removeMemberFromProject = createAsyncThunk('projects/removeMember', async ({ projectId, userId }, { rejectWithValue }) => {
  try {
    const response = await projectApi.removeMember(projectId, userId);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove member from project');
  }
});

export const updateProjectMemberRole = createAsyncThunk('projects/updateMemberRole', async ({ projectId, userId, role }, { rejectWithValue }) => {
  try {
    const response = await projectApi.updateMemberRole(projectId, userId, role);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update member role');
  }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    items: [],
    currentProject: null,
    status: 'idle',
    currentProjectStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(fetchProjectById.pending, (state) => {
        state.currentProjectStatus = 'loading';
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.currentProjectStatus = 'succeeded';
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.currentProjectStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(addMemberToProject.fulfilled, (state, action) => {
        if (state.currentProject && state.currentProject._id === action.payload._id) {
          state.currentProject = action.payload;
        }
        const index = state.items.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(removeMemberFromProject.fulfilled, (state, action) => {
        if (state.currentProject && state.currentProject._id === action.payload._id) {
          state.currentProject = action.payload;
        }
        const index = state.items.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateProjectMemberRole.fulfilled, (state, action) => {
        if (state.currentProject && state.currentProject._id === action.payload._id) {
          state.currentProject = action.payload;
        }
        const index = state.items.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { setCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;
