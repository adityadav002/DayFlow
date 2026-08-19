const teamService = require('../services/teamService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.createTeam(req.user._id, req.params.wid, req.body);
  res.status(201).json(new ApiResponse(201, team, 'Team created successfully'));
});

const getTeams = asyncHandler(async (req, res) => {
  const teams = await teamService.getTeams(req.params.wid, req.user._id);
  res.status(200).json(new ApiResponse(200, teams, 'Teams fetched successfully'));
});

const getTeamById = asyncHandler(async (req, res) => {
  const team = await teamService.getTeamById(req.params.wid, req.params.id);
  res.status(200).json(new ApiResponse(200, team, 'Team details fetched successfully'));
});

const updateTeam = asyncHandler(async (req, res) => {
  const team = await teamService.updateTeam(req.params.wid, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, team, 'Team updated successfully'));
});

const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.deleteTeam(req.params.wid, req.params.id);
  res.status(200).json(new ApiResponse(200, {}, 'Team deleted successfully'));
});

const addMember = asyncHandler(async (req, res) => {
  const team = await teamService.addMember(req.params.wid, req.params.id, req.body.email);
  res.status(200).json(new ApiResponse(200, team, 'Member added to team successfully'));
});

const removeMember = asyncHandler(async (req, res) => {
  const team = await teamService.removeMember(req.params.wid, req.params.id, req.params.uid);
  res.status(200).json(new ApiResponse(200, team, 'Member removed from team successfully'));
});

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember
};
