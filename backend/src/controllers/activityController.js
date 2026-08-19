const activityService = require('../services/activityService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const Task = require('../models/Task');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');

const getBoardActivity = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  // Keep legacy board activity method (using legacy service method if exists)
  if (typeof activityService.getBoardActivity === 'function') {
    const result = await activityService.getBoardActivity(req.params.boardId, page, limit);
    return res.status(200).json(new ApiResponse(200, result.activities, 'Activity fetched successfully', result.meta));
  }
  res.status(200).json(new ApiResponse(200, [], 'Activity fetched successfully'));
});

const getTaskActivity = asyncHandler(async (req, res) => {
  const taskId = req.params.id; // task ID from nested routing
  const { page, limit } = req.query;

  // Validate task membership
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }
  if (task.project) {
    const project = await Project.findById(task.project);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }
    const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) {
      throw new ApiError(403, 'You are not a member of this project');
    }
  }

  const result = await activityService.getTaskActivity(taskId, page, limit);
  res.status(200).json(new ApiResponse(200, result.activities, 'Activity fetched successfully', result.meta));
});

module.exports = {
  getBoardActivity,
  getTaskActivity
};
