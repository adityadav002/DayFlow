const boardService = require('../services/boardService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createBoard = asyncHandler(async (req, res) => {
  const board = await boardService.createBoard(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, board, 'Board created successfully'));
});

const getBoards = asyncHandler(async (req, res) => {
  const boards = await boardService.getBoards(req.user._id);
  res.status(200).json(new ApiResponse(200, boards, 'Boards fetched successfully'));
});

const getBoardById = asyncHandler(async (req, res) => {
  const board = await boardService.getBoardById(req.params.boardId);
  res.status(200).json(new ApiResponse(200, board, 'Board fetched successfully'));
});

const updateBoard = asyncHandler(async (req, res) => {
  const board = await boardService.updateBoard(req.params.boardId, req.body);
  res.status(200).json(new ApiResponse(200, board, 'Board updated successfully'));
});

const deleteBoard = asyncHandler(async (req, res) => {
  await boardService.deleteBoard(req.params.boardId);
  res.status(200).json(new ApiResponse(200, {}, 'Board deleted successfully'));
});

const addMember = asyncHandler(async (req, res) => {
  const board = await boardService.addMember(req.params.boardId, req.body.email, req.user._id);
  res.status(200).json(new ApiResponse(200, board, 'Member added successfully'));
});

const removeMember = asyncHandler(async (req, res) => {
  const board = await boardService.removeMember(req.params.boardId, req.params.userId, req.user._id);
  res.status(200).json(new ApiResponse(200, board, 'Member removed successfully'));
});

module.exports = {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
  addMember,
  removeMember
};
