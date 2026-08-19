const commentService = require('../services/commentService');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getIo } = require('../config/socket');
const { emitToProject } = require('../utils/socketEmitter');

const getComments = asyncHandler(async (req, res) => {
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

  const result = await commentService.getComments(taskId, page, limit);
  res.status(200).json(new ApiResponse(200, result.comments, 'Comments fetched successfully', result.meta));
});

const addComment = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const content = req.body.content || req.body.message;

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Comment content is required');
  }

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

  const comment = await commentService.addComment(taskId, content, req.user._id);

  // Emit WebSocket events
  if (task.project) {
    emitToProject(task.project.toString(), 'COMMENT_CREATED', {
      comment,
      taskId: taskId.toString(),
      projectId: task.project.toString()
    });
  }
  // Compatibility board socket event
  getIo().to(task.boardId.toString()).emit('comment:added', comment);

  res.status(201).json(new ApiResponse(201, comment, 'Comment added successfully'));
});

const editComment = asyncHandler(async (req, res) => {
  const commentId = req.params.cid;
  const content = req.body.content || req.body.message;

  if (!content || !content.trim()) {
    throw new ApiError(400, 'Comment content is required');
  }

  const comment = await commentService.editComment(commentId, content, req.user._id);
  const task = await Task.findById(comment.task);

  if (task && task.project) {
    emitToProject(task.project.toString(), 'COMMENT_UPDATED', {
      comment,
      taskId: task._id.toString(),
      projectId: task.project.toString()
    });
  }

  res.status(200).json(new ApiResponse(200, comment, 'Comment updated successfully'));
});

const deleteComment = asyncHandler(async (req, res) => {
  const commentId = req.params.cid;
  
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  const task = await Task.findById(comment.task);
  if (!task) {
    throw new ApiError(404, 'Parent task not found');
  }

  // Authorization check: creator or project admin/owner
  let isAuthorized = comment.author.toString() === req.user._id.toString();

  if (!isAuthorized && task.project) {
    const project = await Project.findById(task.project);
    if (project) {
      const member = project.members.find(m => m.user.toString() === req.user._id.toString());
      if (member && (member.role === 'admin' || member.role === 'owner')) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new ApiError(403, 'You are not authorized to delete this comment');
  }

  await commentService.deleteComment(commentId, req.user._id, true);

  if (task.project) {
    emitToProject(task.project.toString(), 'COMMENT_DELETED', {
      commentId,
      taskId: task._id.toString(),
      projectId: task.project.toString()
    });
  }
  // Compatibility board socket event
  getIo().to(task.boardId.toString()).emit('comment:deleted', { commentId, taskId: task._id });

  res.status(200).json(new ApiResponse(200, {}, 'Comment deleted successfully'));
});

module.exports = {
  getComments,
  addComment,
  editComment,
  deleteComment
};
