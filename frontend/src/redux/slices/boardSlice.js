import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as boardApi from '../../api/boardApi';

export const fetchBoards = createAsyncThunk('boards/fetchBoards', async (_, { rejectWithValue }) => {
  try {
    const response = await boardApi.getBoards();
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch boards');
  }
});

export const createBoard = createAsyncThunk('boards/createBoard', async (boardData, { rejectWithValue }) => {
  try {
    const response = await boardApi.createBoard(boardData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create board');
  }
});

export const fetchBoardById = createAsyncThunk('boards/fetchBoardById', async (id, { rejectWithValue }) => {
  try {
    const response = await boardApi.getBoardById(id);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch board details');
  }
});

export const addMemberToBoard = createAsyncThunk('boards/addMember', async ({ boardId, email }, { rejectWithValue }) => {
  try {
    const response = await boardApi.addMember(boardId, { email });
    return response.data.data; // Returns the updated board
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add member');
  }
});

export const removeMemberFromBoard = createAsyncThunk('boards/removeMember', async ({ boardId, userId }, { rejectWithValue }) => {
  try {
    const response = await boardApi.removeMember(boardId, userId);
    return response.data.data; // Returns the updated board
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove member');
  }
});

const boardSlice = createSlice({
  name: 'boards',
  initialState: {
    items: [],
    currentBoard: null,
    status: 'idle',
    currentBoardStatus: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchBoards
      .addCase(fetchBoards.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // createBoard
      .addCase(createBoard.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // fetchBoardById
      .addCase(fetchBoardById.pending, (state) => {
        state.currentBoardStatus = 'loading';
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.currentBoardStatus = 'succeeded';
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.currentBoardStatus = 'failed';
        state.error = action.payload;
      })
      // addMemberToBoard
      .addCase(addMemberToBoard.fulfilled, (state, action) => {
        if (state.currentBoard && state.currentBoard._id === action.payload._id) {
          state.currentBoard = action.payload;
        }
        // Update in items list too if present
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // removeMemberFromBoard
      .addCase(removeMemberFromBoard.fulfilled, (state, action) => {
        if (state.currentBoard && state.currentBoard._id === action.payload._id) {
          state.currentBoard = action.payload;
        }
        const index = state.items.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export default boardSlice.reducer;
