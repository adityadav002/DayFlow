import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as taskApi from '../../api/taskApi';

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async (boardId, { rejectWithValue }) => {
  try {
    const response = await taskApi.getTasks(boardId);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk('tasks/createTask', async ({ boardId, data }, { rejectWithValue }) => {
  try {
    const response = await taskApi.createTask(boardId, data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create task');
  }
});

export const updateTask = createAsyncThunk('tasks/updateTask', async ({ taskId, data }, { rejectWithValue }) => {
  try {
    const response = await taskApi.updateTask(taskId, data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update task');
  }
});

export const bulkUpdatePositions = createAsyncThunk('tasks/bulkUpdatePositions', async (data, { rejectWithValue }) => {
  try {
    const response = await taskApi.bulkUpdatePositions(data);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update task positions');
  }
});

export const deleteTask = createAsyncThunk('tasks/deleteTask', async (arg, { rejectWithValue }) => {
  try {
    const taskId = typeof arg === 'string' ? arg : arg.taskId;
    const deleteScope = typeof arg === 'object' ? arg.deleteScope : undefined;
    await taskApi.deleteTask(taskId, deleteScope);
    return taskId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    // Socket real-time updates
    taskAdded: (state, action) => {
      const existing = state.items.find(t => t._id === action.payload._id);
      if (!existing) {
        state.items.push(action.payload);
      }
    },
    taskUpdated: (state, action) => {
      const index = state.items.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    taskDeleted: (state, action) => {
      state.items = state.items.filter((t) => t._id !== action.payload.taskId);
    },
    tasksBulkUpdated: (state, action) => {
      action.payload.forEach((updatedTask) => {
        const index = state.items.findIndex(t => t._id === updatedTask.taskId);
        if (index !== -1) {
          state.items[index].status = updatedTask.status;
          state.items[index].position = updatedTask.position;
          state.items[index].version = updatedTask.version;
        }
      });
      // Sort after bulk update
      state.items.sort((a, b) => a.position - b.position);
    },
    // Optimistic UI updates for drag and drop
    moveTaskOptimistically: (state, action) => {
      const { taskId, newStatus, newPosition } = action.payload;
      const task = state.items.find(t => t._id === taskId);
      if (task) {
        task.status = newStatus;
        task.position = newPosition;
      }
      state.items.sort((a, b) => a.position - b.position);
    },
    commentCountIncremented: (state, action) => {
      const task = state.items.find(t => t._id === action.payload.taskId);
      if (task) {
        task.commentsCount = (task.commentsCount || 0) + 1;
      }
    },
    commentCountDecremented: (state, action) => {
      const task = state.items.find(t => t._id === action.payload.taskId);
      if (task) {
        task.commentsCount = Math.max(0, (task.commentsCount || 0) - 1);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        const existing = state.items.find(t => t._id === action.payload._id);
        if (!existing) {
          state.items.push(action.payload);
        }
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.items.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload);
      })
      .addCase(bulkUpdatePositions.fulfilled, (state, action) => {
        action.payload.forEach((updatedTask) => {
          const index = state.items.findIndex(t => t._id === updatedTask.taskId);
          if (index !== -1) {
            state.items[index].status = updatedTask.status;
            state.items[index].position = updatedTask.position;
            state.items[index].version = updatedTask.version;
          }
        });
        state.items.sort((a, b) => a.position - b.position);
      })
      .addCase(bulkUpdatePositions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { taskAdded, taskUpdated, taskDeleted, tasksBulkUpdated, moveTaskOptimistically, commentCountIncremented, commentCountDecremented } = taskSlice.actions;
export default taskSlice.reducer;
