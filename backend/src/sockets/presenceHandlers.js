const User = require('../models/User');
const Project = require('../models/Project');

// Maps to track active presence state and disconnect debouncing
const userDisconnectTimeouts = new Map();
const userActiveProjects = new Map();

/**
 * Handle user connection: set online status and notify project rooms.
 */
const setUserOnline = async (io, socket, userId) => {
  try {
    // 1. Clear any pending disconnect timeout
    if (userDisconnectTimeouts.has(userId)) {
      clearTimeout(userDisconnectTimeouts.get(userId));
      userDisconnectTimeouts.delete(userId);
    }

    // Update database status
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // 2. Fetch all projects this user is a member of
    const projects = await Project.find({ 'members.user': userId }).select('_id');
    const projectIds = projects.map(p => p._id.toString());

    // 3. Track user active projects
    if (!userActiveProjects.has(userId)) {
      userActiveProjects.set(userId, new Set(projectIds));
      
      // First connection: emit USER_ONLINE to all project rooms
      projectIds.forEach(projectId => {
        io.to(`project:${projectId}`).emit('USER_ONLINE', { userId, projectId });
      });
    } else {
      // User is already online (from another tab), make sure active projects set is updated
      const activeSet = userActiveProjects.get(userId);
      projectIds.forEach(projectId => {
        activeSet.add(projectId);
      });
    }

    // Support legacy compatibility event
    socket.broadcast.emit('user-online', { userId, isOnline: true });

  } catch (err) {
    console.error('Error setting user online:', err);
  }
};

/**
 * Handle user disconnection: start TTL debounce before setting offline.
 */
const setUserOffline = async (io, socket, userId) => {
  try {
    // Start the 5-minute TTL debounce timeout
    const TTL_MS = 5 * 60 * 1000; // 5 minutes
    
    // Clear any existing timeout first just in case
    if (userDisconnectTimeouts.has(userId)) {
      clearTimeout(userDisconnectTimeouts.get(userId));
    }

    const timeoutId = setTimeout(async () => {
      try {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });

        // Retrieve and notify all project rooms
        const activeProjects = userActiveProjects.get(userId);
        if (activeProjects) {
          activeProjects.forEach(projectId => {
            io.to(`project:${projectId}`).emit('USER_OFFLINE', { userId, projectId });
          });
        }

        // Clean up maps
        userActiveProjects.delete(userId);
        userDisconnectTimeouts.delete(userId);

        // Support legacy compatibility event
        io.emit('user-offline', { userId, isOnline: false, lastSeen });
      } catch (innerErr) {
        console.error('Error in deferred offline handler:', innerErr);
      }
    }, TTL_MS);

    userDisconnectTimeouts.set(userId, timeoutId);
  } catch (err) {
    console.error('Error setting user offline:', err);
  }
};

module.exports = {
  setUserOnline,
  setUserOffline,
  userActiveProjects
};
