const Project = require('../models/Project');
const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const createProject = async (userId, projectData) => {
  const { name, description, workspace, team, startDate, dueDate, color, icon } = projectData;

  if (!workspace) {
    throw new ApiError(400, 'Workspace ID is required');
  }

  // 1. Create associated Board
  const board = await Board.create({
    title: name,
    createdBy: userId,
    members: [userId]
  });

  // 2. Create Project
  const project = await Project.create({
    name,
    description: description || '',
    workspace,
    team: team || null,
    startDate: startDate || null,
    dueDate: dueDate || null,
    color: color || null,
    icon: icon || null,
    createdBy: userId,
    boardId: board._id,
    members: [{ user: userId, role: 'owner' }]
  });

  return project;
};

const getProjects = async (userId, query) => {
  const filter = { 'members.user': userId };
  if (query.workspace) {
    filter.workspace = query.workspace;
  }
  return await Project.find(filter)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('boardId');
};

const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('boardId');
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

const updateProject = async (projectId, updates) => {
  const allowedUpdates = ['name', 'description', 'status', 'startDate', 'dueDate', 'color', 'icon', 'team'];
  const updateData = {};
  
  Object.keys(updates).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updateData[key] = updates[key];
    }
  });

  const project = await Project.findByIdAndUpdate(projectId, updateData, { new: true })
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('boardId');

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // If project name updated, sync board title
  if (updates.name && project.boardId) {
    await Board.findByIdAndUpdate(project.boardId, { title: updates.name });
  }

  return project;
};

const deleteProject = async (projectId) => {
  // Soft delete/Archive project
  const project = await Project.findByIdAndUpdate(projectId, { status: 'archived' }, { new: true });
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return project;
};

const addMember = async (projectId, email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const isMember = project.members.some(m => m.user.toString() === user._id.toString());
  if (isMember) {
    throw new ApiError(400, 'User is already a member of this project');
  }

  project.members.push({ user: user._id, role: 'member' });
  await project.save();

  // Also add to associated Board members
  if (project.boardId) {
    await Board.findByIdAndUpdate(project.boardId, {
      $addToSet: { members: user._id }
    });
  }

  return await Project.findById(projectId)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('boardId');
};

const removeMember = async (projectId, userIdToRemove) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.createdBy.toString() === userIdToRemove.toString()) {
    throw new ApiError(400, 'Cannot remove the project owner');
  }

  project.members = project.members.filter(m => m.user.toString() !== userIdToRemove.toString());
  await project.save();

  // Also remove from associated Board members
  if (project.boardId) {
    const board = await Board.findById(project.boardId);
    if (board && board.createdBy.toString() !== userIdToRemove.toString()) {
      board.members = board.members.filter(memberId => memberId.toString() !== userIdToRemove.toString());
      await board.save();
    }
  }

  return await Project.findById(projectId)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('boardId');
};

const getProjectTasks = async (projectId, query) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const filter = {
    $or: [
      { project: projectId },
      { boardId: project.boardId }
    ]
  };

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.assignedTo) filter.assignedTo = query.assignedTo;
  if (query.search) {
    filter.title = { $regex: query.search, $options: 'i' };
  }

  return await Task.find(filter)
    .sort({ position: 1 })
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar');
};

const updateMemberRole = async (projectId, userIdToUpdate, role) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const member = project.members.find(m => m.user.toString() === userIdToUpdate.toString());
  if (!member) {
    throw new ApiError(404, 'Member not found in this project');
  }

  if (member.role === 'owner' && role !== 'owner') {
    const ownersCount = project.members.filter(m => m.role === 'owner').length;
    if (ownersCount <= 1) {
      throw new ApiError(400, 'Cannot demote the only owner of the project');
    }
  }

  member.role = role;
  await project.save();

  return await Project.findById(projectId)
    .populate('members.user', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('boardId');
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectTasks,
  updateMemberRole
};
