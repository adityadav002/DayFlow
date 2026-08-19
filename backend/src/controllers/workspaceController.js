const workspaceService = require('../services/workspaceService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.createWorkspace(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, workspace, 'Workspace created successfully'));
});

const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await workspaceService.getWorkspaces(req.user._id);
  res.status(200).json(new ApiResponse(200, workspaces, 'Workspaces fetched successfully'));
});

const getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.getWorkspaceById(req.params.id);
  res.status(200).json(new ApiResponse(200, workspace, 'Workspace details fetched successfully'));
});

const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, workspace, 'Workspace updated successfully'));
});

const addMember = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.addMember(req.params.id, req.body.email);
  res.status(200).json(new ApiResponse(200, workspace, 'Member added to workspace successfully'));
});

const removeMember = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.removeMember(req.params.id, req.params.uid);
  res.status(200).json(new ApiResponse(200, workspace, 'Member removed from workspace successfully'));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const workspace = await workspaceService.updateMemberRole(req.params.id, req.params.uid, req.body.role);
  res.status(200).json(new ApiResponse(200, workspace, 'Member role updated successfully'));
});

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  addMember,
  removeMember,
  updateMemberRole
};
