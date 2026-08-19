const Task = require('../models/Task');
const TimeEntry = require('../models/TimeEntry');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const activityService = require('../services/activityService');
const { emitToProject } = require('../utils/socketEmitter');
const mongoose = require('mongoose');

const startTimer = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  if (task.activeTimer && task.activeTimer.user && task.activeTimer.user.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'Timer is already running for you on this task');
  }

  task.activeTimer = {
    user: req.user._id,
    startedAt: new Date(),
    pausedDuration: 0
  };
  await task.save();

  emitToProject(task.project.toString(), 'TASK_TIMER_STARTED', {
    taskId: task._id.toString(),
    userId: req.user._id.toString(),
    startedAt: task.activeTimer.startedAt
  });

  res.status(200).json(new ApiResponse(200, task.activeTimer, 'Timer started successfully'));
});

const pauseTimer = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const timer = task.activeTimer;
  if (!timer || !timer.user || timer.user.toString() !== req.user._id.toString()) {
    throw new ApiError(400, 'No running timer found for you on this task');
  }

  if (!timer.startedAt) {
    throw new ApiError(400, 'Timer is already paused');
  }

  const elapsed = Math.floor((new Date() - new Date(timer.startedAt)) / 1000);
  timer.pausedDuration += elapsed;
  timer.startedAt = null; 
  await task.save();

  res.status(200).json(new ApiResponse(200, task.activeTimer, 'Timer paused successfully'));
});

const resumeTimer = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const timer = task.activeTimer;
  if (!timer || !timer.user || timer.user.toString() !== req.user._id.toString()) {
    throw new ApiError(400, 'No active timer found for you on this task');
  }

  if (timer.startedAt) {
    throw new ApiError(400, 'Timer is already running');
  }

  timer.startedAt = new Date();
  await task.save();

  res.status(200).json(new ApiResponse(200, task.activeTimer, 'Timer resumed successfully'));
});

const stopTimer = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const timer = task.activeTimer;
  if (!timer || !timer.user || timer.user.toString() !== req.user._id.toString()) {
    throw new ApiError(400, 'No active timer found for you on this task');
  }

  let elapsedSeconds = timer.pausedDuration;
  if (timer.startedAt) {
    elapsedSeconds += Math.floor((new Date() - new Date(timer.startedAt)) / 1000);
  }

  const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  task.activeTimer = {
    user: null,
    startedAt: null,
    pausedDuration: 0
  };
  await task.save();

  const entry = await TimeEntry.create({
    task: task._id,
    user: req.user._id,
    project: task.project,
    startTime: new Date(Date.now() - elapsedSeconds * 1000),
    endTime: new Date(),
    duration: durationMinutes,
    note: req.body.note || 'Logged via timer',
    isManual: false
  });

  await updateTaskActualDuration(task._id);

  await activityService.recordActivity(task._id, req.user._id, 'status_changed', {
    actionDetail: 'timer_stopped',
    duration: durationMinutes
  });

  emitToProject(task.project.toString(), 'TASK_TIMER_STOPPED', {
    taskId: task._id.toString(),
    userId: req.user._id.toString(),
    duration: durationMinutes
  });

  res.status(201).json(new ApiResponse(201, entry, 'Timer stopped and time entry created'));
});

const getTimerStatus = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const timer = task.activeTimer;
  if (!timer || !timer.user || timer.user.toString() !== req.user._id.toString()) {
    return res.status(200).json(new ApiResponse(200, { status: 'idle', elapsedSeconds: 0 }, 'Timer is idle'));
  }

  let elapsedSeconds = timer.pausedDuration;
  if (timer.startedAt) {
    elapsedSeconds += Math.floor((new Date() - new Date(timer.startedAt)) / 1000);
  }

  res.status(200).json(new ApiResponse(200, {
    status: timer.startedAt ? 'running' : 'paused',
    elapsedSeconds,
    startedAt: timer.startedAt,
    pausedDuration: timer.pausedDuration
  }, 'Timer status fetched'));
});

const logManualTime = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const { duration, note, date } = req.body;

  if (!duration || duration <= 0) {
    throw new ApiError(400, 'Duration must be greater than 0');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const entry = await TimeEntry.create({
    task: task._id,
    user: req.user._id,
    project: task.project,
    startTime: date ? new Date(date) : new Date(),
    endTime: date ? new Date(date) : new Date(),
    duration,
    note: note || '',
    isManual: true
  });

  await updateTaskActualDuration(task._id);

  await activityService.recordActivity(task._id, req.user._id, 'status_changed', {
    actionDetail: 'time_logged_manually',
    duration
  });

  res.status(201).json(new ApiResponse(201, entry, 'Manual time logged successfully'));
});

const getTimeEntries = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const entries = await TimeEntry.find({ task: taskId })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, entries, 'Time entries fetched successfully'));
});

const deleteTimeEntry = asyncHandler(async (req, res) => {
  const { id, eid } = req.params;

  const entry = await TimeEntry.findById(eid);
  if (!entry) {
    throw new ApiError(404, 'Time entry not found');
  }

  const Project = require('../models/Project');
  const project = await Project.findById(entry.project);
  
  const isOwner = entry.user.toString() === req.user._id.toString();
  const isManager = project && project.members.some(m => m.user.toString() === req.user._id.toString() && (m.role === 'admin' || m.role === 'owner' || m.role === 'manager'));

  if (!isOwner && !isManager) {
    throw new ApiError(403, 'Unauthorized to delete this time entry');
  }

  await TimeEntry.deleteOne({ _id: eid });
  await updateTaskActualDuration(id);

  res.status(200).json(new ApiResponse(200, {}, 'Time entry deleted successfully'));
});

async function updateTaskActualDuration(taskId) {
  const result = await TimeEntry.aggregate([
    { $match: { task: new mongoose.Types.ObjectId(taskId) } },
    { $group: { _id: '$task', total: { $sum: '$duration' } } }
  ]);

  const total = result.length > 0 ? result[0].total : 0;
  await Task.findByIdAndUpdate(taskId, { actualDuration: total });
}

module.exports = {
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  getTimerStatus,
  logManualTime,
  getTimeEntries,
  deleteTimeEntry
};
