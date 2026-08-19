const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notificationService');

// Parse mentions
function parseMentions(content) {
  const matches = content.match(/@(\w+)/g) || [];
  return matches.map(m => m.slice(1).toLowerCase());
}

// Resolve mentions to User IDs
async function resolveMentions(usernames) {
  if (usernames.length === 0) return [];
  const users = await User.find({ username: { $in: usernames } }, '_id');
  return users.map(u => u._id);
}

/**
 * Get paginated task comments, oldest first.
 */
const getComments = async (taskId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const comments = await Comment.find({ task: taskId })
    .populate('author', 'name avatar username')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Comment.countDocuments({ task: taskId });
  return {
    comments,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Add a new comment with mention parsing and MENTION notifications.
 */
const addComment = async (taskId, content, userId) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  const usernames = parseMentions(content);
  const resolvedUserIds = await resolveMentions(usernames);

  const comment = await Comment.create({
    task: taskId,
    author: userId,
    content,
    mentions: resolvedUserIds
  });

  const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar username');

  // Send MENTION notifications to all valid mentioned users (except author)
  for (const recipientId of resolvedUserIds) {
    if (recipientId.toString() === userId.toString()) continue;

    await notificationService.createNotification({
      recipient: recipientId,
      type: 'MENTION',
      title: 'Mentioned in Comment',
      body: `${populatedComment.author.name} mentioned you in a comment: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
      entityType: 'task',
      entityId: taskId,
      actor: userId,
      metadata: {
        boardId: task.boardId.toString(),
        projectId: task.project ? task.project.toString() : ''
      }
    }).catch(err => console.error('Failed to create mention notification:', err));
  }

  return populatedComment;
};

/**
 * Edit a comment and process new mentions.
 */
const editComment = async (commentId, content, userId) => {
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new ApiError(403, 'You can only edit your own comments');
  }

  const previousMentions = (comment.mentions || []).map(id => id.toString());
  const usernames = parseMentions(content);
  const resolvedUserIds = await resolveMentions(usernames);

  comment.content = content;
  comment.mentions = resolvedUserIds;
  comment.isEdited = true;
  comment.editedAt = Date.now();
  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate('author', 'name avatar username');

  const task = await Task.findById(comment.task);
  for (const recipientId of resolvedUserIds) {
    if (recipientId.toString() === userId.toString()) continue;

    // Send MENTION notification only if they were not already mentioned before the edit
    if (!previousMentions.includes(recipientId.toString())) {
      await notificationService.createNotification({
        recipient: recipientId,
        type: 'MENTION',
        title: 'Mentioned in Comment',
        body: `${populatedComment.author.name} mentioned you in an edited comment: "${content.substring(0, 60)}${content.length > 60 ? '...' : ''}"`,
        entityType: 'task',
        entityId: comment.task,
        actor: userId,
        metadata: {
          boardId: task.boardId.toString(),
          projectId: task.project ? task.project.toString() : ''
        }
      }).catch(err => console.error('Failed to create mention notification:', err));
    }
  }

  return populatedComment;
};

/**
 * Delete a comment.
 */
const deleteComment = async (commentId, userId, bypassAuth = false) => {
  const comment = await Comment.findById(commentId);
  if (!comment) return null;

  if (!bypassAuth && comment.author.toString() !== userId.toString()) {
    throw new ApiError(403, 'You are not authorized to delete this comment');
  }

  await Comment.findByIdAndDelete(commentId);
  return comment;
};

module.exports = {
  getComments,
  addComment,
  editComment,
  deleteComment
};
