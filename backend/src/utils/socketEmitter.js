const { getIo, userSocketsMap } = require('../config/socket');

/**
 * Emit an event to a specific project room.
 * @param {string} projectId 
 * @param {string} event 
 * @param {any} payload 
 */
function emitToProject(projectId, event, payload) {
  try {
    getIo().to(`project:${projectId}`).emit(event, payload);
  } catch (error) {
    console.error(`Error emitting event ${event} to project:${projectId}:`, error);
  }
}

/**
 * Emit an event to a specific user room.
 * @param {string} userId 
 * @param {string} event 
 * @param {any} payload 
 */
function emitToUser(userId, event, payload) {
  try {
    getIo().to(`user:${userId}`).emit(event, payload);
  } catch (error) {
    console.error(`Error emitting event ${event} to user:${userId}:`, error);
  }
}

/**
 * Emit an event to a specific workspace room.
 * @param {string} workspaceId 
 * @param {string} event 
 * @param {any} payload 
 */
function emitToWorkspace(workspaceId, event, payload) {
  try {
    getIo().to(`workspace:${workspaceId}`).emit(event, payload);
  } catch (error) {
    console.error(`Error emitting event ${event} to workspace:${workspaceId}:`, error);
  }
}

/**
 * Make all active sockets of a user join a project room.
 * Useful when a member is added to a project via REST API.
 * @param {string} userId 
 * @param {string} projectId 
 */
function joinUserToProjectRoom(userId, projectId) {
  try {
    const socketIds = userSocketsMap.get(userId.toString());
    if (socketIds) {
      const io = getIo();
      socketIds.forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.join(`project:${projectId}`);
        }
      });
    }
  } catch (error) {
    console.error(`Error joining user ${userId} to project room ${projectId}:`, error);
  }
}

/**
 * Make all active sockets of a user leave a project room.
 * Useful when a member is removed from a project via REST API.
 * @param {string} userId 
 * @param {string} projectId 
 */
function leaveUserFromProjectRoom(userId, projectId) {
  try {
    const socketIds = userSocketsMap.get(userId.toString());
    if (socketIds) {
      const io = getIo();
      socketIds.forEach((socketId) => {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.leave(`project:${projectId}`);
        }
      });
    }
  } catch (error) {
    console.error(`Error removing user ${userId} from project room ${projectId}:`, error);
  }
}

module.exports = {
  emitToProject,
  emitToUser,
  emitToWorkspace,
  joinUserToProjectRoom,
  leaveUserFromProjectRoom
};
