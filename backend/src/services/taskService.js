const mongoose = require('mongoose');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const activityService = require('./activityService');

const getTasks = async (boardId, query) => {
  const filter = { boardId };
  
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo === 'null' ? null : query.assignedTo;
  if (query.project) filter.project = query.project;
  if (query.context) filter.context = query.context;
  if (query.createdBy) filter.createdBy = query.createdBy;

  if (query.tags) {
    const tagsArr = typeof query.tags === 'string' ? query.tags.split(',') : query.tags;
    filter.tags = { $in: tagsArr };
  }

  if (query.dueDate) {
    const { startOfDay, endOfDay, startOfWeek, endOfWeek } = require('date-fns');
    const now = new Date();
    
    if (query.dueDate === 'today') {
      filter.dueDate = {
        $gte: startOfDay(now),
        $lte: endOfDay(now)
      };
    } else if (query.dueDate === 'this_week') {
      filter.dueDate = {
        $gte: startOfWeek(now),
        $lte: endOfWeek(now)
      };
    } else if (query.dueDate === 'overdue') {
      filter.dueDate = {
        $lt: startOfDay(now)
      };
      filter.status = { $ne: 'Done' };
    }
  } else if (query.dueDateStart || query.dueDateEnd) {
    filter.dueDate = {};
    if (query.dueDateStart) {
      filter.dueDate.$gte = new Date(query.dueDateStart);
    }
    if (query.dueDateEnd) {
      filter.dueDate.$lte = new Date(query.dueDateEnd);
    }
  }

  if (query.search) {
    filter.title = { $regex: query.search, $options: 'i' };
  }

  if (query.includeTemplates !== 'true') {
    filter.isRecurringTemplate = { $ne: true };
  }

  const tasks = await Task.find(filter).sort({ position: 1 }).populate('assignedTo', 'name avatar').populate('commentsCount');
  return tasks;
};

const createTask = async (boardId, taskData, userId) => {
  // Simple append at the end logic for new task: finding max position in that status
  const maxPositionTask = await Task.findOne({ boardId, status: taskData.status || 'Todo' })
    .sort({ position: -1 })
    .select('position');

  const newPosition = maxPositionTask ? maxPositionTask.position + 65536 : 65536;

  // Resolve project association
  let projectId = taskData.project || null;
  if (!projectId) {
    const Project = require('../models/Project');
    const project = await Project.findOne({ boardId });
    if (project) {
      projectId = project._id;
    }
  }

  const isRecur = taskData.isRecurring === true || taskData.isRecurring === 'true';
  const recurrenceRule = taskData.recurrenceRule;

  if (isRecur && recurrenceRule && recurrenceRule.frequency) {
    const templateTask = await Task.create({
      ...taskData,
      boardId,
      project: projectId,
      createdBy: userId,
      position: taskData.position || newPosition,
      isRecurringTemplate: true,
      recurrenceActive: true
    });

    const firstOccurrenceDate = taskData.dueDate ? new Date(taskData.dueDate) : new Date();
    
    const firstOccurrence = await Task.create({
      ...taskData,
      boardId,
      project: projectId,
      createdBy: userId,
      position: (taskData.position || newPosition) + 10,
      isRecurringTemplate: false,
      isRecurring: false,
      occurrenceDate: firstOccurrenceDate,
      dueDate: firstOccurrenceDate,
      parentRecurringTask: templateTask._id
    });

    const { getNextOccurrence } = require('../utils/recurrenceEngine');
    templateTask.nextOccurrenceDate = getNextOccurrence(recurrenceRule, firstOccurrenceDate);
    await templateTask.save();

    await activityService.recordActivity(firstOccurrence._id, userId, 'created', { title: firstOccurrence.title });
    try { require('../controllers/dashboardController').clearDashboardCache(); } catch (e) {}

    return await Task.findById(firstOccurrence._id).populate('assignedTo', 'name avatar').populate('commentsCount');
  }

  const task = await Task.create({
    ...taskData,
    boardId,
    project: projectId,
    createdBy: userId,
    position: taskData.position || newPosition
  });

  await activityService.recordActivity(task._id, userId, 'created', { title: task.title });
  try { require('../controllers/dashboardController').clearDashboardCache(); } catch (e) {}

  return await Task.findById(task._id).populate('assignedTo', 'name avatar').populate('commentsCount');
};

const updateTask = async (taskId, updates, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Optimistic concurrency control check
  if (updates.version !== undefined && updates.version !== task.version) {
    throw new ApiError(409, 'Conflict: Task was updated by another user. Please refresh and try again.', [], true, 'CONFLICT');
  }

  const oldStatus = task.status;
  const oldPriority = task.priority;
  const oldDueDate = task.dueDate;
  const oldAssignedTo = task.assignedTo;
  const oldTitle = task.title;
  const oldDescription = task.description;

  const editScope = updates.editScope || 'this';

  if (editScope === 'all' && task.parentRecurringTask) {
    const template = await Task.findById(task.parentRecurringTask);
    if (template) {
      const fieldsToSet = {};
      const allowedKeys = ['title', 'description', 'priority', 'context', 'tags', 'assignedTo', 'recurrenceRule', 'recurrenceActive', 'isRecurring'];
      allowedKeys.forEach(key => {
        if (updates[key] !== undefined) {
          template[key] = updates[key];
          fieldsToSet[key] = updates[key];
        }
      });
      await template.save();
      await Task.updateMany(
        { parentRecurringTask: template._id },
        { $set: fieldsToSet }
      );
    }
  } else if (editScope === 'this_and_following' && task.parentRecurringTask) {
    const template = await Task.findById(task.parentRecurringTask);
    if (template) {
      const curDate = task.occurrenceDate || task.dueDate || new Date();
      template.recurrenceRule = {
        ...template.recurrenceRule,
        endDate: curDate
      };
      template.recurrenceActive = false;
      await template.save();

      const newTemplate = await Task.create({
        ...template.toObject(),
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        dueDate: curDate,
        isRecurringTemplate: true,
        recurrenceActive: true,
        recurrenceRule: {
          ...template.recurrenceRule,
          ...updates.recurrenceRule
        }
      });

      await Task.updateMany(
        { parentRecurringTask: template._id, occurrenceDate: { $gte: curDate } },
        { $set: { parentRecurringTask: newTemplate._id } }
      );
    }
  }

  Object.keys(updates).forEach((key) => {
    if (key !== 'version' && key !== 'editScope') {
      task[key] = updates[key];
    }
  });

  task.version += 1;
  await task.save();
  try { require('../controllers/dashboardController').clearDashboardCache(); } catch (e) {}

  // Log activities based on changed fields
  const newStatus = task.status;
  if (oldStatus !== newStatus) {
    if (newStatus === 'Done') {
      await activityService.recordActivity(task._id, userId, 'completed');
      
      // Resolve blockers
      try {
        const TaskDependency = require('../models/TaskDependency');
        const { createNotification } = require('./notificationService');
        const { emitToProject } = require('../utils/socketEmitter');
        
        const deps = await TaskDependency.find({ blockingTask: task._id });
        for (const dep of deps) {
          const dependentTaskId = dep.blockedTask;
          const oldDependent = await Task.findById(dependentTaskId).select('hasBlockers');
          
          await updateTaskBlockersState(dependentTaskId);
          
          const dependentTask = await Task.findById(dependentTaskId);
          if (dependentTask && oldDependent && oldDependent.hasBlockers && !dependentTask.hasBlockers) {
            if (dependentTask.assignedTo && dependentTask.assignedTo.toString() !== userId.toString()) {
              await createNotification({
                recipient: dependentTask.assignedTo,
                type: 'TASK_UNBLOCKED',
                title: 'Task Unblocked',
                message: `"${task.title}" is complete. "${dependentTask.title}" is now unblocked.`,
                link: `/tasks/${dependentTask._id}`
              });
            }
            
            emitToProject(task.project.toString(), 'TASK_DEPENDENCY_RESOLVED', {
              taskId: dependentTask._id.toString(),
              resolvedBlockerId: task._id.toString(),
              allResolved: true
            });
          }
        }
      } catch (err) {
        console.error('Error resolving blockers:', err);
      }
    } else if (oldStatus === 'Done') {
      await activityService.recordActivity(task._id, userId, 'reopened');
    } else {
      await activityService.recordActivity(task._id, userId, 'status_changed', { from: oldStatus, to: newStatus });
    }
  }

  if (updates.priority && oldPriority !== task.priority) {
    await activityService.recordActivity(task._id, userId, 'priority_changed', { from: oldPriority, to: task.priority });
  }

  if (updates.dueDate !== undefined && String(oldDueDate) !== String(task.dueDate)) {
    await activityService.recordActivity(task._id, userId, 'due_date_changed', { from: oldDueDate, to: task.dueDate });
  }

  if (updates.assignedTo !== undefined && String(oldAssignedTo || '') !== String(task.assignedTo || '')) {
    if (task.assignedTo) {
      const User = require('../models/User');
      const assignee = await User.findById(task.assignedTo);
      const assigneeName = assignee ? assignee.name : 'Unknown User';
      await activityService.recordActivity(task._id, userId, 'assigned', {
        to: task.assignedTo,
        toName: assigneeName
      });
    } else {
      await activityService.recordActivity(task._id, userId, 'unassigned');
    }
  }

  if (updates.title && oldTitle !== task.title) {
    await activityService.recordActivity(task._id, userId, 'title_changed', { from: oldTitle, to: task.title });
  }

  if (updates.description !== undefined && oldDescription !== task.description) {
    await activityService.recordActivity(task._id, userId, 'description_changed');
  }

  return await Task.findById(task._id).populate('assignedTo', 'name avatar').populate('commentsCount');
};

const bulkUpdatePositions = async (boardId, tasksUpdates, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const update of tasksUpdates) {
      // Support matching legacy documents that do not have the version field in the DB yet
      const versionFilter = (update.version === 0 || !update.version)
        ? { $or: [{ version: update.version }, { version: { $exists: false } }, { version: null }] }
        : { version: update.version };

      const result = await Task.updateOne(
        { _id: update.taskId, boardId, ...versionFilter },
        { 
          $set: { status: update.status, position: update.position },
          $inc: { version: 1 }
        },
        { session }
      );

      if (result.matchedCount !== 1) {
        console.error('[BULK] Match failed for task:', update.taskId, 'boardId:', boardId, 'versionFilter:', versionFilter);
        throw new ApiError(409, 'Conflict: Some tasks could not be updated due to version mismatch. Please refresh.', [], true, 'CONFLICT');
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Log a single generic bulk move activity to avoid spam
    await activityService.logActivity(boardId, null, 'TASK_MOVED', userId, { count: tasksUpdates.length });

    // Fetch and return updated tasks
    const taskIds = tasksUpdates.map(u => u.taskId);
    return await Task.find({ _id: { $in: taskIds } }).select('_id status position version');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const deleteTask = async (taskId, userId, deleteScope = 'this') => {
  const task = await Task.findById(taskId);
  if (!task) return;

  if (deleteScope === 'all' && task.parentRecurringTask) {
    const template = await Task.findById(task.parentRecurringTask);
    if (template) {
      const occurrences = await Task.find({ parentRecurringTask: template._id });
      for (const occurrence of occurrences) {
        await deleteTask(occurrence._id, userId, 'this');
      }
      await Task.findByIdAndDelete(template._id);
      return;
    }
  }

  const boardId = task.boardId;

  // Blocker resolution/notification on deletion
  try {
    const TaskDependency = require('../models/TaskDependency');
    const { createNotification } = require('./notificationService');
    const { emitToProject } = require('../utils/socketEmitter');

    const deps = await TaskDependency.find({ blockingTask: taskId });
    
    await TaskDependency.deleteMany({
      $or: [{ blockedTask: taskId }, { blockingTask: taskId }]
    });

    for (const dep of deps) {
      const dependentTaskId = dep.blockedTask;
      const oldDependent = await Task.findById(dependentTaskId).select('hasBlockers');

      await updateTaskBlockersState(dependentTaskId);

      const dependentTask = await Task.findById(dependentTaskId);
      if (dependentTask && oldDependent && oldDependent.hasBlockers && !dependentTask.hasBlockers) {
        if (dependentTask.assignedTo && dependentTask.assignedTo.toString() !== userId.toString()) {
          await createNotification({
            recipient: dependentTask.assignedTo,
            type: 'TASK_UNBLOCKED',
            title: 'Task Unblocked',
            message: `Blocking task "${task.title}" was deleted. "${dependentTask.title}" is now unblocked.`,
            link: `/tasks/${dependentTask._id}`
          });
        }
        
        emitToProject(task.project.toString(), 'TASK_DEPENDENCY_RESOLVED', {
          taskId: dependentTask._id.toString(),
          resolvedBlockerId: task._id.toString(),
          allResolved: true
        });
      }
    }
  } catch (err) {
    console.error('Error handling dependency cleanup on task deletion:', err);
  }

  await Task.findByIdAndDelete(taskId);
  try { require('../controllers/dashboardController').clearDashboardCache(); } catch (e) {}

  await activityService.logActivity(boardId, taskId, 'TASK_DELETED', userId, { title: task.title });
};

const addAttachment = async (taskId, file, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const attachment = {
    filename: file.originalname,
    url: `/uploads/${file.filename}`,
    mimetype: file.mimetype,
    size: file.size
  };

  task.attachments.push(attachment);
  task.version += 1;
  await task.save();

  await activityService.recordActivity(task._id, userId, 'attachment_added', { filename: attachment.filename });

  return attachment;
};

// Periodic rebalance to avoid fractional indexing precision loss (optional manual trigger or CRON)
const rebalancePositions = async (boardId) => {
  // Logic to re-spread positions evenly across integer intervals
  const tasks = await Task.find({ boardId }).sort({ status: 1, position: 1 });
  let currentStatus = null;
  let counter = 1;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bulkOps = [];
    for (const task of tasks) {
      if (task.status !== currentStatus) {
        currentStatus = task.status;
        counter = 1;
      }
      const newPos = counter * 65536;
      bulkOps.push({
        updateOne: {
          filter: { _id: task._id },
          update: { $set: { position: newPos }, $inc: { version: 1 } }
        }
      });
      counter++;
    }

    if (bulkOps.length > 0) {
      await Task.bulkWrite(bulkOps, { session });
    }

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const updateTaskBlockersState = async (taskId) => {
  const TaskDependency = require('../models/TaskDependency');
  const Task = require('../models/Task');
  const deps = await TaskDependency.find({ blockedTask: taskId });
  let unresolvedCount = 0;
  for (const dep of deps) {
    const blockingTask = await Task.findById(dep.blockingTask);
    if (blockingTask && blockingTask.status !== 'Done') {
      unresolvedCount++;
    }
  }
  await Task.findByIdAndUpdate(taskId, {
    hasBlockers: unresolvedCount > 0,
    blockersCount: unresolvedCount
  });
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  bulkUpdatePositions,
  deleteTask,
  addAttachment,
  rebalancePositions
};
