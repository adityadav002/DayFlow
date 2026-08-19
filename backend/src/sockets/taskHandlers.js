const registerTaskHandlers = (io, socket) => {
  // task:created, task:updated, task:deleted, task:moved are typically emitted from the REST API controllers
  // but if the client initiates them via sockets, they would be handled here.
  // In our architecture, the client hits REST API, which then uses io.to().emit()
  // So we just need to handle ephemeral events here like typing.

  socket.on('typing:start', ({ boardId, taskId }) => {
    socket.to(boardId).emit('typing:start', {
      taskId,
      userId: socket.user._id,
      userName: socket.user.name
    });
  });

  socket.on('typing:stop', ({ boardId, taskId }) => {
    socket.to(boardId).emit('typing:stop', {
      taskId,
      userId: socket.user._id,
      userName: socket.user.name
    });
  });

  // Client emitting comment added (if using sockets instead of REST, but REST is preferred)
  // socket.on('comment:added', (payload) => { ... })
};

module.exports = { registerTaskHandlers };
