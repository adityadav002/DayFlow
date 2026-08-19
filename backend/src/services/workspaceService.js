const Workspace = require('../models/Workspace');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const createWorkspace = async (userId, { name, description }) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
  const workspace = await Workspace.create({
    name,
    slug,
    description: description || '',
    owner: userId,
    members: [{ user: userId, role: 'owner' }]
  });
  return workspace;
};

const getWorkspaces = async (userId) => {
  let workspaces = await Workspace.find({ 'members.user': userId })
    .populate('members.user', 'name email avatar')
    .populate('owner', 'name email avatar');

  if (workspaces.length === 0) {
    const user = await User.findById(userId);
    if (user) {
      const slug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
      const newWs = await Workspace.create({
        name: `${user.name}'s Workspace`,
        slug,
        owner: user._id,
        members: [{ user: user._id, role: 'owner' }],
        isPersonal: true
      });
      const populatedWs = await Workspace.findById(newWs._id)
        .populate('members.user', 'name email avatar')
        .populate('owner', 'name email avatar');
      workspaces = [populatedWs];
    }
  }

  return workspaces;
};

const getWorkspaceById = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId)
    .populate('members.user', 'name email avatar')
    .populate('owner', 'name email avatar');
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }
  return workspace;
};

const updateWorkspace = async (workspaceId, { name, description }) => {
  const updates = {};
  if (name) {
    updates.name = name;
    updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
  }
  if (description !== undefined) {
    updates.description = description;
  }
  const workspace = await Workspace.findByIdAndUpdate(workspaceId, updates, { new: true })
    .populate('members.user', 'name email avatar')
    .populate('owner', 'name email avatar');
  return workspace;
};

const addMember = async (workspaceId, email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const isMember = workspace.members.some(m => m.user.toString() === user._id.toString());
  if (isMember) {
    throw new ApiError(400, 'User is already a member of this workspace');
  }

  workspace.members.push({ user: user._id, role: 'member' });
  await workspace.save();

  return await Workspace.findById(workspaceId)
    .populate('members.user', 'name email avatar')
    .populate('owner', 'name email avatar');
};

const removeMember = async (workspaceId, userIdToRemove) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (workspace.owner.toString() === userIdToRemove.toString()) {
    throw new ApiError(400, 'Cannot remove the workspace owner');
  }

  workspace.members = workspace.members.filter(m => m.user.toString() !== userIdToRemove.toString());
  await workspace.save();

  return await Workspace.findById(workspaceId)
    .populate('members.user', 'name email avatar')
    .populate('owner', 'name email avatar');
};

const updateMemberRole = async (workspaceId, userIdToUpdate, role) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  const member = workspace.members.find(m => m.user.toString() === userIdToUpdate.toString());
  if (!member) {
    throw new ApiError(404, 'Member not found in this workspace');
  }

  if (member.role === 'owner' && role !== 'owner') {
    const ownersCount = workspace.members.filter(m => m.role === 'owner').length;
    if (ownersCount <= 1) {
      throw new ApiError(400, 'Cannot demote the only owner of the workspace');
    }
  }

  member.role = role;
  if (role === 'owner') {
    workspace.owner = userIdToUpdate;
  }
  await workspace.save();

  return await Workspace.findById(workspaceId)
    .populate('members.user', 'name email avatar')
    .populate('owner', 'name email avatar');
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  addMember,
  removeMember,
  updateMemberRole
};
