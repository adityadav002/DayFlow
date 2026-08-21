const Notification = require('../models/Notification');
const { emitToUser } = require('../utils/socketEmitter');

/**
 * Create a persistent notification and broadcast it to the recipient's room.
 */
const createNotification = async ({ recipient, type, title, body, entityType, entityId, actor, metadata }) => {
  try {
    let notification = new Notification({
      recipient,
      type,
      title,
      body,
      entityType,
      entityId,
      actor,
      metadata
    });

    await notification.save();

    // Populate actor fields for rich client notification display
    notification = await Notification.findById(notification._id)
      .populate('actor', 'name avatar')
      .exec();

    // Broadcast to user's personal WebSocket channel
    emitToUser(recipient.toString(), 'NOTIFICATION_CREATED', { notification });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const mongoose = require('mongoose');

/**
 * Scan database for tasks due in less than 24 hours and emit alerts.
 */
const checkUpcomingDeadlines = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.warn('[JOBS] MongoDB unavailable; skipping deadline check to prevent errors.');
    return;
  }

  try {
    const Task = require('../models/Task');
    const now = new Date();
    const targetTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours in the future

    // Query uncompleted tasks due within next 24 hours
    const tasks = await Task.find({
      dueDate: { $gte: now, $lte: targetTime },
      status: { $ne: 'Done' }
    });

    for (const task of tasks) {
      if (!task.assignedTo) continue;

      const recipientId = task.assignedTo.toString();

      // Deduplicate: search for TASK_DEADLINE_SOON notification for this taskId in last 25 hours
      const bufferTime = new Date(now.getTime() - 25 * 60 * 60 * 1000);
      const existing = await Notification.findOne({
        recipient: recipientId,
        type: 'TASK_DEADLINE_SOON',
        entityId: task._id,
        createdAt: { $gte: bufferTime }
      });

      if (!existing) {
        await createNotification({
          recipient: recipientId,
          type: 'TASK_DEADLINE_SOON',
          title: 'Upcoming Task Deadline',
          body: `The task "${task.title}" is due in less than 24 hours.`,
          entityType: 'task',
          entityId: task._id,
          actor: null,
          metadata: {
            boardId: task.boardId.toString(),
            projectId: task.project ? task.project.toString() : ''
          }
        });
      }
    }
  } catch (error) {
    console.error('Error executing deadline approaching checker:', error);
  }
};

/**
 * Start the background cron interval for checking deadlines.
 */
const startDeadlineJob = () => {
  console.log('[JOBS] Starting background task deadline check (hourly interval)');
  
  // Run once on startup
  checkUpcomingDeadlines();

  // Run every hour
  setInterval(checkUpcomingDeadlines, 60 * 60 * 1000);
};

module.exports = {
  createNotification,
  checkUpcomingDeadlines,
  startDeadlineJob
};
