const ApiError = require('../utils/ApiError');
const Board = require('../models/Board');
const asyncHandler = require('../utils/asyncHandler');
const { ERROR_CODES } = require('../utils/constants');

const ROLE_HIERARCHY = { owner: 4, admin: 3, manager: 2, member: 1 };

const requireBoardMember = asyncHandler(async (req, res, next) => {
  const boardId = req.params.boardId || req.body.boardId || req.query.boardId;

  if (!boardId) {
    return next(new ApiError(400, 'Board ID is required'));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ApiError(404, 'Board not found', [], true, ERROR_CODES.NOT_FOUND));
  }

  const isMember = board.members.includes(req.user._id) || board.createdBy.toString() === req.user._id.toString();

  if (!isMember) {
    return next(new ApiError(403, 'You are not a member of this board', [], true, ERROR_CODES.UNAUTHORIZED));
  }

  // Attach board to request to save future DB hits
  req.board = board;
  next();
});

const requireBoardOwner = asyncHandler(async (req, res, next) => {
  const boardId = req.params.boardId || req.body.boardId || req.query.boardId;

  if (!boardId) {
    return next(new ApiError(400, 'Board ID is required'));
  }

  const board = await Board.findById(boardId);

  if (!board) {
    return next(new ApiError(404, 'Board not found', [], true, ERROR_CODES.NOT_FOUND));
  }

  const isOwner = board.createdBy.toString() === req.user._id.toString();

  if (!isOwner) {
    return next(new ApiError(403, 'You must be the board owner to perform this action', [], true, ERROR_CODES.UNAUTHORIZED));
  }

  req.board = board;
  next();
});

const requireWorkspaceRole = (minRole) => {
  return asyncHandler(async (req, res, next) => {
    const workspaceId = req.params.wid || req.params.id || req.body.workspaceId || req.body.workspace;
    if (!workspaceId) {
      return next(new ApiError(400, 'Workspace ID is required'));
    }

    const Workspace = require('../models/Workspace');
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new ApiError(404, 'Workspace not found', [], true, ERROR_CODES.NOT_FOUND));
    }

    const member = workspace.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) {
      return next(new ApiError(403, 'You are not a member of this workspace', [], true, ERROR_CODES.UNAUTHORIZED));
    }

    const userRoleValue = ROLE_HIERARCHY[member.role] || 0;
    const requiredRoleValue = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      return next(new ApiError(403, `Permission denied: requires at least '${minRole}' role`, [], true, ERROR_CODES.UNAUTHORIZED));
    }

    req.workspace = workspace;
    next();
  });
};

const requireProjectRole = (minRole) => {
  return asyncHandler(async (req, res, next) => {
    const projectId = req.params.projectId || req.params.id || req.body.projectId || req.body.project;
    if (!projectId) {
      return next(new ApiError(400, 'Project ID is required'));
    }

    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ApiError(404, 'Project not found', [], true, ERROR_CODES.NOT_FOUND));
    }

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) {
      return next(new ApiError(403, 'You are not a member of this project', [], true, ERROR_CODES.UNAUTHORIZED));
    }

    const userRoleValue = ROLE_HIERARCHY[member.role] || 0;
    const requiredRoleValue = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      return next(new ApiError(403, `Permission denied: requires at least '${minRole}' role`, [], true, ERROR_CODES.UNAUTHORIZED));
    }

    req.project = project;
    next();
  });
};

const requireTeamRole = (minRole) => {
  return asyncHandler(async (req, res, next) => {
    const teamId = req.params.teamId || req.params.id || req.body.teamId || req.body.team;
    if (!teamId) {
      return next(new ApiError(400, 'Team ID is required'));
    }

    const Team = require('../models/Team');
    const team = await Team.findById(teamId);
    if (!team) {
      return next(new ApiError(404, 'Team not found', [], true, ERROR_CODES.NOT_FOUND));
    }

    const member = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) {
      return next(new ApiError(403, 'You are not a member of this team', [], true, ERROR_CODES.UNAUTHORIZED));
    }

    const userRoleValue = ROLE_HIERARCHY[member.role] || 0;
    const requiredRoleValue = ROLE_HIERARCHY[minRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      return next(new ApiError(403, `Permission denied: requires at least '${minRole}' role`, [], true, ERROR_CODES.UNAUTHORIZED));
    }

    req.team = team;
    next();
  });
};

const requireTaskPermission = (action) => {
  return asyncHandler(async (req, res, next) => {
    const taskId = req.params.id || req.params.taskId;
    if (!taskId) {
      return next(new ApiError(400, 'Task ID is required'));
    }

    const Task = require('../models/Task');
    const task = await Task.findById(taskId);
    if (!task) {
      return next(new ApiError(404, 'Task not found', [], true, ERROR_CODES.NOT_FOUND));
    }

    // Check if task belongs to a project
    if (task.project) {
      const Project = require('../models/Project');
      const project = await Project.findById(task.project);
      if (!project) {
        return next(new ApiError(404, 'Project not found', [], true, ERROR_CODES.NOT_FOUND));
      }

      const member = project.members.find(m => m.user.toString() === req.user._id.toString());
      if (!member) {
        return next(new ApiError(403, 'You are not a member of this project', [], true, ERROR_CODES.UNAUTHORIZED));
      }

      const userRoleValue = ROLE_HIERARCHY[member.role] || 0;
      const isOwnerOrAssignee = task.createdBy.toString() === req.user._id.toString() || (task.assignedTo && task.assignedTo.toString() === req.user._id.toString());

      if (action === 'edit' || action === 'delete') {
        if (action === 'edit' && req.body && req.body.assignedTo !== undefined) {
          if (userRoleValue < ROLE_HIERARCHY.manager) {
            return next(new ApiError(403, 'Permission denied: you cannot assign tasks', [], true, ERROR_CODES.UNAUTHORIZED));
          }
        }
        // Owner/Admin/Manager can edit/delete any task. Teammates can only edit/delete their own task.
        if (userRoleValue < ROLE_HIERARCHY.manager && !isOwnerOrAssignee) {
          return next(new ApiError(403, `Permission denied: you can only ${action} tasks you created or are assigned to`, [], true, ERROR_CODES.UNAUTHORIZED));
        }
      } else if (action === 'assign') {
        // Teammates cannot assign tasks to other users
        if (userRoleValue < ROLE_HIERARCHY.manager) {
          return next(new ApiError(403, `Permission denied: you cannot assign tasks`, [], true, ERROR_CODES.UNAUTHORIZED));
        }
      }
    } else {
      // Standalone Board: Fallback to checking board membership
      const Board = require('../models/Board');
      const board = await Board.findById(task.boardId);
      if (!board) {
        return next(new ApiError(404, 'Board not found', [], true, ERROR_CODES.NOT_FOUND));
      }

      const isMember = board.members.includes(req.user._id) || board.createdBy.toString() === req.user._id.toString();
      if (!isMember) {
        return next(new ApiError(403, 'You are not a member of this board', [], true, ERROR_CODES.UNAUTHORIZED));
      }
    }

    req.task = task;
    next();
  });
};

module.exports = {
  requireBoardMember,
  requireBoardOwner,
  requireWorkspaceRole,
  requireProjectRole,
  requireTeamRole,
  requireTaskPermission
};
