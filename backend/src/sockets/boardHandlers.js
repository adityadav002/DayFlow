const Board = require('../models/Board');

const registerBoardHandlers = (io, socket) => {
  socket.on('join-board', async ({ boardId }) => {
    try {
      if (!boardId) return;

      // Verify membership before joining
      const board = await Board.findById(boardId);
      if (!board) {
        socket.emit('error', { message: 'Board not found' });
        return;
      }

      const isMember = board.members.includes(socket.user._id) || board.createdBy.toString() === socket.user._id.toString();
      
      if (!isMember) {
        socket.emit('error', { message: 'Unauthorized to join this board' });
        return;
      }

      socket.join(boardId);
      // Optional: Inform others that a user started viewing the board
      // io.to(boardId).emit('user-joined', { userId: socket.user._id, name: socket.user.name });
    } catch (error) {
      console.error('join-board error', error);
    }
  });

  socket.on('leave-board', ({ boardId }) => {
    if (boardId) {
      socket.leave(boardId);
    }
  });

  socket.on('board:sync-request', ({ boardId }) => {
    // Client asking for a full refresh (can be handled by just telling them to refetch via API)
    // Or we could emit a sync event back. Usually telling them to refetch is enough.
    socket.emit('board:sync-now');
  });
};

module.exports = { registerBoardHandlers };
