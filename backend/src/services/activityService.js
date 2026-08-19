const Activity = require('../models/Activity');

/**
 * Record a new task-scoped activity log entry.
 */
const recordActivity = async (taskId, actorId, action, metadata = {}) => {
  try {
    await Activity.create({
      task: taskId,
      actor: actorId,
      action,
      metadata
    });
  } catch (error) {
    console.error('Failed to record activity:', error);
  }
};

/**
 * Get paginated task-scoped activity log entries, oldest first.
 */
const getTaskActivity = async (taskId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const activities = await Activity.find({ task: taskId })
    .sort({ createdAt: 1 }) // oldest first (chronological order)
    .skip(skip)
    .limit(limit)
    .populate('actor', 'name avatar username');

  const total = await Activity.countDocuments({ task: taskId });

  return {
    activities,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Legacy support for board-scoped logging, maps to task activity if taskId is provided.
 */
const logActivity = async (boardId, taskId, action, performedBy, metadata = {}) => {
  const actionMap = {
    'TASK_CREATED': 'created',
    'TASK_MOVED': 'status_changed',
    'TASK_UPDATED': 'status_changed',
    'MEMBER_ADDED': 'member_added',
    'MEMBER_REMOVED': 'member_removed'
  };
  const mappedAction = actionMap[action] || action.toLowerCase();
  
  if (taskId) {
    await recordActivity(taskId, performedBy, mappedAction, metadata);
  }
};

module.exports = {
  recordActivity,
  getTaskActivity,
  logActivity
};
