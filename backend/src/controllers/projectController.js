const projectService = require('../services/projectService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, project, 'Project created successfully'));
});

const getProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.getProjects(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, projects, 'Projects fetched successfully'));
});

const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  res.status(200).json(new ApiResponse(200, project, 'Project details fetched successfully'));
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);

  const { emitToProject } = require('../utils/socketEmitter');
  emitToProject(req.params.id, 'PROJECT_UPDATED', {
    project,
    changedFields: Object.keys(req.body)
  });

  res.status(200).json(new ApiResponse(200, project, 'Project updated successfully'));
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectService.deleteProject(req.params.id);
  res.status(200).json(new ApiResponse(200, project, 'Project archived successfully'));
});

const addMember = asyncHandler(async (req, res) => {
  const project = await projectService.addMember(req.params.id, req.body.email);

  const User = require('../models/User');
  const addedUser = await User.findOne({ email: req.body.email });

  if (addedUser) {
    const { emitToProject, joinUserToProjectRoom } = require('../utils/socketEmitter');
    emitToProject(req.params.id, 'TEAM_MEMBER_ADDED', {
      user: {
        _id: addedUser._id.toString(),
        name: addedUser.name,
        email: addedUser.email,
        avatar: addedUser.avatar
      },
      projectId: req.params.id,
      addedBy: req.user._id.toString()
    });

    joinUserToProjectRoom(addedUser._id, req.params.id);

    // Send project member added notification
    const { createNotification } = require('../services/notificationService');
    createNotification({
      recipient: addedUser._id.toString(),
      type: 'TEAM_MEMBER_ADDED',
      title: 'Added to Project',
      body: `You have been added to the project "${project.name}" by ${req.user.name}.`,
      entityType: 'project',
      entityId: project._id,
      actor: req.user._id,
      metadata: {
        projectId: project._id.toString()
      }
    }).catch(err => console.error('Error creating member added notification:', err));
  }

  res.status(200).json(new ApiResponse(200, project, 'Member added to project successfully'));
});

const removeMember = asyncHandler(async (req, res) => {
  const project = await projectService.removeMember(req.params.id, req.params.uid);

  const { emitToProject, leaveUserFromProjectRoom } = require('../utils/socketEmitter');
  emitToProject(req.params.id, 'TEAM_MEMBER_REMOVED', {
    userId: req.params.uid,
    projectId: req.params.id,
    removedBy: req.user._id.toString()
  });

  leaveUserFromProjectRoom(req.params.uid, req.params.id);

  // Send project member removed notification
  const { createNotification } = require('../services/notificationService');
  createNotification({
    recipient: req.params.uid,
    type: 'TEAM_MEMBER_REMOVED',
    title: 'Removed from Project',
    body: `You have been removed from the project "${project.name}" by ${req.user.name}.`,
    entityType: 'project',
    entityId: project._id,
    actor: req.user._id,
    metadata: {
      projectId: project._id.toString()
    }
  }).catch(err => console.error('Error creating member removed notification:', err));

  res.status(200).json(new ApiResponse(200, project, 'Member removed from project successfully'));
});

const getProjectTasks = asyncHandler(async (req, res) => {
  const tasks = await projectService.getProjectTasks(req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, tasks, 'Project tasks fetched successfully'));
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const project = await projectService.updateMemberRole(req.params.id, req.params.uid, req.body.role);
  res.status(200).json(new ApiResponse(200, project, 'Member role updated successfully'));
});

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
