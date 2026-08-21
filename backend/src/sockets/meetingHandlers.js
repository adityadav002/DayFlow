module.exports.registerMeetingHandlers = (io, socket) => {
  const userId = socket.user._id.toString();

  // Join a meeting room for broadcast events
  socket.on('meeting:join', ({ meetingId }) => {
    if (!meetingId) return;
    const room = `meeting_${meetingId}`;
    socket.join(room);
    
    // Notify others in the room
    socket.to(room).emit('meeting:user_joined', {
      userId,
      socketId: socket.id
    });
  });

  // Handle WebRTC signaling (Offer, Answer, ICE Candidates)
  // We use targeted signaling to specific users via their `user:${targetUserId}` room
  socket.on('webrtc:signal', ({ targetUserId, signal, meetingId }) => {
    if (!targetUserId || !signal) return;
    
    io.to(`user:${targetUserId}`).emit('webrtc:signal', {
      senderId: userId,
      signal,
      meetingId
    });
  });

  // Leave a meeting room
  socket.on('meeting:leave', ({ meetingId }) => {
    if (!meetingId) return;
    const room = `meeting_${meetingId}`;
    socket.leave(room);
    
    socket.to(room).emit('meeting:user_left', {
      userId,
      socketId: socket.id
    });
  });

  // Media state changes (mute mic, stop cam)
  socket.on('meeting:media_state', ({ meetingId, state }) => {
    if (!meetingId) return;
    const room = `meeting_${meetingId}`;
    
    socket.to(room).emit('meeting:media_state_changed', {
      userId,
      state // e.g. { audio: false, video: true }
    });
  });
};
