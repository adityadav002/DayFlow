const Board = require('../models/Board');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const activityService = require('./activityService');

const createBoard = async (userId, { title }) => {
  const board = await Board.create({
    title,
    createdBy: userId,
    members: [userId]
  });

  return board;
};

const getBoards = async (userId) => {
  return await Board.find({ members: userId }).populate('members', 'name email avatar');
};

const getBoardById = async (boardId) => {
  return await Board.findById(boardId)
    .populate('members', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

const updateBoard = async (boardId, { title }) => {
  const board = await Board.findByIdAndUpdate(boardId, { title }, { new: true });
  return board;
};

const deleteBoard = async (boardId) => {
  const Task = require('../models/Task');
  const Activity = require('../models/Activity');
  const Comment = require('../models/Comment');
  const Attachment = require('../models/Attachment');

  // Find all tasks associated with this board
  const tasks = await Task.find({ boardId });
  const taskIds = tasks.map(t => t._id);

  if (taskIds.length > 0) {
    // Delete activities and comments associated with these tasks
    await Activity.deleteMany({ task: { $in: taskIds } });
    await Comment.deleteMany({ task: { $in: taskIds } });
    
    // Delete attachments associated with these tasks
    await Attachment.deleteMany({ entityType: 'task', entityId: { $in: taskIds } });

    // Delete the tasks themselves
    await Task.deleteMany({ boardId });
  }

  // Delete the board
  await Board.findByIdAndDelete(boardId);
};

const addMember = async (boardId, email, addedByUserId) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const board = await Board.findById(boardId);
  if (board.members.includes(user._id)) {
    throw new ApiError(400, 'User is already a member', [], true, 'DUPLICATE_BOARD_MEMBER');
  }

  board.members.push(user._id);
  await board.save();

  await activityService.logActivity(boardId, null, 'MEMBER_ADDED', addedByUserId, { addedUserId: user._id });

  return await Board.findById(boardId)
    .populate('members', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

const removeMember = async (boardId, userIdToRemove, removedByUserId) => {
  const board = await Board.findById(boardId);
  
  if (board.createdBy.toString() === userIdToRemove.toString()) {
    throw new ApiError(400, 'Cannot remove the board owner');
  }

  board.members = board.members.filter((memberId) => memberId.toString() !== userIdToRemove.toString());
  await board.save();

  await activityService.logActivity(boardId, null, 'MEMBER_REMOVED', removedByUserId, { removedUserId: userIdToRemove });

  return await Board.findById(boardId)
    .populate('members', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
};
