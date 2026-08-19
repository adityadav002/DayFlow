const Team = require('../models/Team');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const createTeam = async (userId, workspaceId, { name, description, color }) => {
  const team = await Team.create({
    name,
    description: description || '',
    workspace: workspaceId,
    color: color || null,
    createdBy: userId,
    members: [{ user: userId, role: 'owner' }]
  });
  return team;
};

const getTeams = async (workspaceId, userId) => {
  return await Team.find({ workspace: workspaceId, 'members.user': userId })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

const getTeamById = async (workspaceId, teamId) => {
  const team = await Team.findOne({ _id: teamId, workspace: workspaceId })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  return team;
};

const updateTeam = async (workspaceId, teamId, { name, description, color }) => {
  const updates = {};
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (color !== undefined) updates.color = color;

  const team = await Team.findOneAndUpdate({ _id: teamId, workspace: workspaceId }, updates, { new: true })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
  return team;
};

const deleteTeam = async (workspaceId, teamId) => {
  const team = await Team.findOneAndDelete({ _id: teamId, workspace: workspaceId });
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }
};

const addMember = async (workspaceId, teamId, email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const team = await Team.findOne({ _id: teamId, workspace: workspaceId });
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  const isMember = team.members.some(m => m.user.toString() === user._id.toString());
  if (isMember) {
    throw new ApiError(400, 'User is already a member of this team');
  }

  team.members.push({ user: user._id, role: 'member' });
  await team.save();

  return await Team.findById(teamId)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

const removeMember = async (workspaceId, teamId, userIdToRemove) => {
  const team = await Team.findOne({ _id: teamId, workspace: workspaceId });
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  const isCreator = team.createdBy.toString() === userIdToRemove.toString();
  if (isCreator) {
    throw new ApiError(400, 'Cannot remove the team creator');
  }

  team.members = team.members.filter(m => m.user.toString() !== userIdToRemove.toString());
  await team.save();

  return await Team.findById(teamId)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember
};
