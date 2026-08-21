import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeMeeting: null, // { _id, title, type, host }
  participants: [], // [{ userId, audio: boolean, video: boolean }]
  incomingCall: null, // { meetingId, title, caller, type }
  isLocalAudioMuted: false,
  isLocalVideoMuted: false,
  isScreenSharing: false,
  callStatus: 'idle', // 'idle', 'ringing', 'pre_join', 'connecting', 'connected'
  error: null,
};

const meetingSlice = createSlice({
  name: 'meeting',
  initialState,
  reducers: {
    setIncomingCall: (state, action) => {
      state.incomingCall = action.payload;
      state.callStatus = 'ringing';
    },
    clearIncomingCall: (state) => {
      state.incomingCall = null;
      if (state.callStatus === 'ringing') {
        state.callStatus = 'idle';
      }
    },
    joinMeeting: (state, action) => {
      state.activeMeeting = action.payload.meeting;
      state.callStatus = 'pre_join';
      state.incomingCall = null;
    },
    confirmJoinMeeting: (state) => {
      state.callStatus = 'connecting';
    },
    setMeetingConnected: (state) => {
      state.callStatus = 'connected';
    },
    leaveMeeting: (state) => {
      state.activeMeeting = null;
      state.participants = [];
      state.callStatus = 'idle';
      state.isLocalAudioMuted = false;
      state.isLocalVideoMuted = false;
      state.isScreenSharing = false;
    },
    addParticipant: (state, action) => {
      const { userId } = action.payload;
      if (!state.participants.find(p => p.userId === userId)) {
        state.participants.push({ userId, audio: true, video: true });
      }
    },
    removeParticipant: (state, action) => {
      state.participants = state.participants.filter(p => p.userId !== action.payload.userId);
    },
    updateParticipantMediaState: (state, action) => {
      const { userId, state: mediaState } = action.payload;
      const participant = state.participants.find(p => p.userId === userId);
      if (participant) {
        participant.audio = mediaState.audio !== undefined ? mediaState.audio : participant.audio;
        participant.video = mediaState.video !== undefined ? mediaState.video : participant.video;
      }
    },
    toggleLocalAudio: (state) => {
      state.isLocalAudioMuted = !state.isLocalAudioMuted;
    },
    toggleLocalVideo: (state) => {
      state.isLocalVideoMuted = !state.isLocalVideoMuted;
    },
    setScreenSharing: (state, action) => {
      state.isScreenSharing = action.payload;
    },
    setMeetingError: (state, action) => {
      state.error = action.payload;
    }
  },
});

export const {
  setIncomingCall,
  clearIncomingCall,
  joinMeeting,
  confirmJoinMeeting,
  setMeetingConnected,
  leaveMeeting,
  addParticipant,
  removeParticipant,
  updateParticipantMediaState,
  toggleLocalAudio,
  toggleLocalVideo,
  setScreenSharing,
  setMeetingError
} = meetingSlice.actions;

export default meetingSlice.reducer;
