const { Server } = require('socket.io');
const env = require('./env');
const socketAuth = require('../sockets/socketAuth');
const boardHandlers = require('../sockets/boardHandlers');
const taskHandlers = require('../sockets/taskHandlers');
const presenceHandlers = require('../sockets/presenceHandlers');

let io;

// In-memory presence map: Map<userId, Set<socketId>>
// For multi-instance scaling, this should be moved to Redis (e.g. using socket.io-redis adapter and Redis GET/SET)
const userSocketsMap = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  // Authentication Middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    
    // Add to presence map
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId).add(socket.id);

    try {
      // 1. Join user's personal room
      await socket.join(`user:${userId}`);

      // 2. Fetch and join workspace rooms
      const Workspace = require('../models/Workspace');
      const workspaces = await Workspace.find({ 'members.user': socket.user._id }).select('_id');
      for (const ws of workspaces) {
        await socket.join(`workspace:${ws._id.toString()}`);
      }

      // 3. Fetch and join project rooms
      const Project = require('../models/Project');
      const projects = await Project.find({ 'members.user': socket.user._id }).select('_id');
      for (const proj of projects) {
        await socket.join(`project:${proj._id.toString()}`);
      }

      // Set user online
      await presenceHandlers.setUserOnline(io, socket, userId);

      // Emit initial list of online users to the connecting client
      socket.emit('presence:initial', Array.from(userSocketsMap.keys()));
    } catch (err) {
      console.error('Error initializing socket connection rooms and presence:', err);
    }

    // Register handlers
    boardHandlers.registerBoardHandlers(io, socket);
    taskHandlers.registerTaskHandlers(io, socket);

    socket.on('disconnect', () => {
      // Remove from presence map
      const userSockets = userSocketsMap.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          userSocketsMap.delete(userId);
          presenceHandlers.setUserOffline(io, socket, userId);
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = initSocket;
module.exports.getIo = getIo;
module.exports.userSocketsMap = userSocketsMap;
