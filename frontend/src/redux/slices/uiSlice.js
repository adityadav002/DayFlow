import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    onlineUsers: [], // Array of user IDs
    socketConnected: true,
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    userOnline: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    userOffline: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    }
  },
});

export const { toggleSidebar, setOnlineUsers, userOnline, userOffline, setSocketConnected } = uiSlice.actions;
export default uiSlice.reducer;
