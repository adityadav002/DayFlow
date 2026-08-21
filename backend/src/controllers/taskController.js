const taskService = require('../services/taskService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { getIo } = require('../config/socket');

const getTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.getTasks(req.params.boardId, req.query);
  res.status(200).json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.params.boardId, req.body, req.user._id);
  
  // Compatibility event
  getIo().to(req.params.boardId).emit('task:created', task);

  // New M7 real-time event: TASK_CREATED
  if (task.project) {
    const Project = require('../models/Project');
    const project = await Project.findById(task.project);
    const workspaceId = project ? project.workspace.toString() : null;

    const { emitToProject } = require('../utils/socketEmitter');
    emitToProject(task.project.toString(), 'TASK_CREATED', {
      task,
      projectId: task.project.toString(),
      workspaceId
    });
  }

  res.status(201).json(new ApiResponse(201, task, 'Task created successfully'));
});

const updateTask = asyncHandler(async (req, res) => {
  const oldTask = await require('../models/Task').findById(req.params.id);
  const task = await taskService.updateTask(req.params.id, req.body, req.user._id);
  
  // Compatibility event
  if (task.boardId) {
    getIo().to(task.boardId.toString()).emit('task:updated', task);
  }

  // New M7 real-time events
  if (task.project) {
    const projectId = task.project.toString();
    const { emitToProject, emitToUser } = require('../utils/socketEmitter');
    const changedFields = Object.keys(req.body).filter(k => k !== 'version');

    // Helper: extract ObjectId from potentially populated assignedTo
    const assigneeId = task.assignedTo ? (task.assignedTo._id || task.assignedTo).toString() : null;

    // 1. Check status change
    if (req.body.status && oldTask && oldTask.status !== req.body.status) {
      emitToProject(projectId, 'TASK_STATUS_CHANGED', {
        taskId: task._id.toString(),
        oldStatus: oldTask.status,
        newStatus: task.status,
        changedBy: req.user._id.toString(),
        projectId
      });

      // Send completion notification
      if (req.body.status === 'Done' && assigneeId && assigneeId !== req.user._id.toString()) {
        const { createNotification } = require('../services/notificationService');
        createNotification({
          recipient: assigneeId,
          type: 'TASK_COMPLETED',
          title: 'Task Completed',
          body: `The task "${task.title}" has been completed by ${req.user.name}.`,
          entityType: 'task',
          entityId: task._id,
          actor: req.user._id,
          metadata: {
            boardId: task.boardId.toString(),
            projectId: task.project ? task.project.toString() : ''
          }
        }).catch(err => console.error('Error creating completion notification:', err));
      }
    }

    // 2. Check due date change
    if (req.body.dueDate !== undefined && oldTask && String(oldTask.dueDate) !== String(task.dueDate)) {
      emitToProject(projectId, 'TASK_DUE_DATE_CHANGED', {
        taskId: task._id.toString(),
        oldDueDate: oldTask.dueDate,
        newDueDate: task.dueDate,
        changedBy: req.user._id.toString(),
        projectId
      });

      // Send deadline changed notification
      if (assigneeId && assigneeId !== req.user._id.toString()) {
        const { createNotification } = require('../services/notificationService');
        createNotification({
          recipient: assigneeId,
          type: 'DEADLINE_CHANGED',
          title: 'Task Deadline Changed',
          body: `The deadline for task "${task.title}" was changed by ${req.user.name}.`,
          entityType: 'task',
          entityId: task._id,
          actor: req.user._id,
          metadata: {
            boardId: task.boardId.toString(),
            projectId: task.project ? task.project.toString() : ''
          }
        }).catch(err => console.error('Error creating deadline change notification:', err));
      }
    }

    // 3. Check assignment change
    if (req.body.assignedTo !== undefined && oldTask && String(oldTask.assignedTo) !== String(task.assignedTo?._id || task.assignedTo)) {
      emitToProject(projectId, 'TASK_ASSIGNED', {
        task,
        assignedTo: assigneeId,
        assignedBy: req.user._id.toString(),
        projectId
      });
      if (assigneeId) {
        emitToUser(assigneeId, 'TASK_ASSIGNED', {
          task,
          assignedTo: assigneeId,
          assignedBy: req.user._id.toString(),
          projectId
        });

        // Send task assigned notification
        if (assigneeId !== req.user._id.toString()) {
          const { createNotification } = require('../services/notificationService');
          createNotification({
            recipient: assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            body: `You have been assigned the task "${task.title}" by ${req.user.name}.`,
            entityType: 'task',
            entityId: task._id,
            actor: req.user._id,
            metadata: {
              boardId: task.boardId.toString(),
              projectId: task.project ? task.project.toString() : ''
            }
          }).catch(err => console.error('Error creating task assignment notification:', err));
        }
      }
    }

    // 4. General TASK_UPDATED
    emitToProject(projectId, 'TASK_UPDATED', {
      task,
      changedFields,
      projectId,
      updatedBy: req.user._id.toString()
    });
  }

  res.status(200).json(new ApiResponse(200, task, 'Task updated successfully'));
});

const bulkUpdatePositions = asyncHandler(async (req, res) => {
  const updatedTasks = await taskService.bulkUpdatePositions(req.body.boardId, req.body.tasks, req.user._id);

  const socketPayload = updatedTasks.map(t => ({
    taskId: t._id,
    status: t.status,
    position: t.position,
    version: t.version
  }));

  getIo().to(req.body.boardId).emit('task:bulk-updated', socketPayload);
  res.status(200).json(new ApiResponse(200, socketPayload, 'Tasks positions updated successfully'));
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await require('../models/Task').findById(req.params.id);
  const deleteScope = req.body?.deleteScope || req.query?.deleteScope || 'this';
  await taskService.deleteTask(req.params.id, req.user._id, deleteScope);
  if (task) {
    // Compatibility event
    if (task.boardId) {
      getIo().to(task.boardId.toString()).emit('task:deleted', { taskId: req.params.id });
    }

    // New M7 real-time event: TASK_DELETED
    if (task.project) {
      const { emitToProject } = require('../utils/socketEmitter');
      emitToProject(task.project.toString(), 'TASK_DELETED', {
        taskId: req.params.id,
        projectId: task.project.toString()
      });
    }
  }
  res.status(200).json(new ApiResponse(200, {}, 'Task deleted successfully'));
});

const addAttachment = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file' });
  }
  const attachment = await taskService.addAttachment(req.params.id, req.file, req.user._id);
  res.status(200).json(new ApiResponse(200, attachment, 'Attachment added successfully'));
});

// ─── Subtask Controllers ─────────────────────────────────────────────────────

const Task = require('../models/Task');
const mongoose = require('mongoose');

const getSubtasks = asyncHandler(async (req, res) => {
  const subtasks = await Task.find({ parentTask: req.params.id })
    .populate('assignedTo', 'name avatar')
    .sort({ createdAt: 1 });
  res.status(200).json(new ApiResponse(200, subtasks, 'Subtasks fetched successfully'));
});

const createSubtask = asyncHandler(async (req, res) => {
  const parentId = req.params.id;
  const parent = await Task.findById(parentId);
  if (!parent) {
    return res.status(404).json({ success: false, message: 'Parent task not found' });
  }
  // Prevent circular reference
  if (parentId === req.body.parentTask) {
    return res.status(400).json({ success: false, message: 'A task cannot be its own subtask' });
  }

  // Count max position for subtasks
  const existingCount = await Task.countDocuments({ parentTask: parentId });

  const subtask = await Task.create({
    title: req.body.title,
    description: req.body.description || '',
    priority: req.body.priority || 'Medium',
    dueDate: req.body.dueDate || null,
    status: 'Todo',
    boardId: parent.boardId,
    createdBy: req.user._id,
    parentTask: parentId,
    position: existingCount
  });

  // Atomically increment parent subtaskProgress total
  await Task.findByIdAndUpdate(parentId, {
    $inc: { 'subtaskProgress.total': 1 }
  });

  const activityService = require('../services/activityService');
  await activityService.recordActivity(parentId, req.user._id, 'subtask_added', { title: subtask.title });

  res.status(201).json(new ApiResponse(201, subtask, 'Subtask created successfully'));
});

const updateSubtask = asyncHandler(async (req, res) => {
  const subtask = await Task.findOneAndUpdate(
    { _id: req.params.sid, parentTask: req.params.id },
    { ...req.body },
    { new: true, runValidators: true }
  );
  if (!subtask) {
    return res.status(404).json({ success: false, message: 'Subtask not found' });
  }
  res.status(200).json(new ApiResponse(200, subtask, 'Subtask updated successfully'));
});

const completeSubtask = asyncHandler(async (req, res) => {
  const subtask = await Task.findOne({ _id: req.params.sid, parentTask: req.params.id });
  if (!subtask) {
    return res.status(404).json({ success: false, message: 'Subtask not found' });
  }
  const wasCompleted = subtask.status === 'Done';
  const newStatus = wasCompleted ? 'Todo' : 'Done';

  subtask.status = newStatus;
  await subtask.save();

  // Atomically update parent completed count
  const delta = wasCompleted ? -1 : 1;
  const parent = await Task.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'subtaskProgress.completed': delta } },
    { new: true }
  );

  if (newStatus === 'Done') {
    const activityService = require('../services/activityService');
    await activityService.recordActivity(req.params.id, req.user._id, 'subtask_completed', { title: subtask.title });
  }

  res.status(200).json(new ApiResponse(200, { subtask, parent }, 'Subtask status toggled'));
});

const deleteSubtask = asyncHandler(async (req, res) => {
  const subtask = await Task.findOneAndDelete({ _id: req.params.sid, parentTask: req.params.id });
  if (!subtask) {
    return res.status(404).json({ success: false, message: 'Subtask not found' });
  }

  // Decrement parent progress counts
  const completedDelta = subtask.status === 'Done' ? -1 : 0;
  await Task.findByIdAndUpdate(req.params.id, {
    $inc: {
      'subtaskProgress.total': -1,
      'subtaskProgress.completed': completedDelta
    }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Subtask deleted successfully'));
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  bulkUpdatePositions,
  deleteTask,
  addAttachment,
  getSubtasks,
  createSubtask,
  updateSubtask,
  completeSubtask,
  deleteSubtask
};

