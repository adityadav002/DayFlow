const TaskDependency = require('../models/TaskDependency');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const activityService = require('../services/activityService');

// Circular dependency check helper
const checkCircularDependency = async (taskId, targetBlockerId, depth = 0) => {
  if (depth > 10) {
    throw new ApiError(400, 'Dependency chain too complex to validate.');
  }
  if (taskId.toString() === targetBlockerId.toString()) {
    return true;
  }
  const deps = await TaskDependency.find({ blockedTask: targetBlockerId });
  for (const dep of deps) {
    const isCircular = await checkCircularDependency(taskId, dep.blockingTask, depth + 1);
    if (isCircular) return true;
  }
  return false;
};

const updateTaskBlockersState = async (taskId) => {
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

const getDependencies = asyncHandler(async (req, res) => {
  const taskId = req.params.id;

  // Find tasks that block this task
  const blockedByDeps = await TaskDependency.find({ blockedTask: taskId })
    .populate('blockingTask', '_id title status priority dueDate assignedTo hasBlockers');
  const blockedBy = blockedByDeps.map(d => d.blockingTask).filter(Boolean);

  // Find tasks that this task blocks
  const blockingDeps = await TaskDependency.find({ blockingTask: taskId })
    .populate('blockedTask', '_id title status priority dueDate assignedTo hasBlockers');
  const blocking = blockingDeps.map(d => d.blockedTask).filter(Boolean);

  res.status(200).json(new ApiResponse(200, { blockedBy, blocking }, 'Dependencies fetched successfully'));
});

const addDependency = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const { blockingTaskId } = req.body;

  if (!blockingTaskId) {
    throw new ApiError(400, 'Blocking task ID is required');
  }

  if (taskId.toString() === blockingTaskId.toString()) {
    throw new ApiError(400, 'A task cannot depend on itself');
  }

  const blockedTask = await Task.findById(taskId);
  const blockingTask = await Task.findById(blockingTaskId);

  if (!blockedTask || !blockingTask) {
    throw new ApiError(404, 'One or both tasks not found');
  }

  if (!blockedTask.project || !blockingTask.project || blockedTask.project.toString() !== blockingTask.project.toString()) {
    throw new ApiError(400, 'Dependencies must be within the same project');
  }

  // Circular dependency check
  const isCircular = await checkCircularDependency(taskId, blockingTaskId);
  if (isCircular) {
    throw new ApiError(400, 'Adding this dependency would create a circular chain');
  }

  // Check if it already exists
  const existing = await TaskDependency.findOne({ blockedTask: taskId, blockingTask: blockingTaskId });
  if (existing) {
    throw new ApiError(400, 'Dependency already exists');
  }

  const dependency = await TaskDependency.create({
    blockedTask: taskId,
    blockingTask: blockingTaskId,
    createdBy: req.user._id,
    project: blockedTask.project
  });

  // Update blockers state
  await updateTaskBlockersState(taskId);

  // Log activity
  await activityService.recordActivity(taskId, req.user._id, 'status_changed', {
    actionDetail: 'dependency_added',
    blockingTask: { id: blockingTask._id, title: blockingTask.title }
  });

  res.status(201).json(new ApiResponse(201, dependency, 'Dependency created successfully'));
});

const removeDependency = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const { depId } = req.params;

  let dependency = await TaskDependency.findById(depId);
  if (!dependency) {
    dependency = await TaskDependency.findOne({ blockedTask: taskId, blockingTask: depId });
  }

  if (!dependency) {
    throw new ApiError(404, 'Dependency not found');
  }

  const blockingTask = await Task.findById(dependency.blockingTask);

  await TaskDependency.deleteOne({ _id: dependency._id });

  // Update blockers state
  await updateTaskBlockersState(taskId);

  // Log activity
  await activityService.recordActivity(taskId, req.user._id, 'status_changed', {
    actionDetail: 'dependency_removed',
    blockingTask: blockingTask ? { id: blockingTask._id, title: blockingTask.title } : { id: dependency.blockingTask }
  });

  res.status(200).json(new ApiResponse(200, {}, 'Dependency removed successfully'));
});

module.exports = {
  getDependencies,
  addDependency,
  removeDependency
};
