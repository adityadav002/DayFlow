const Team = require('../models/Team');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

// In-memory dashboard cache
const dashboardCache = new Map();

// Helper to clear cache globally
const clearDashboardCache = () => {
  dashboardCache.clear();
  try {
    const { clearAnalyticsCache } = require('./analyticsController');
    clearAnalyticsCache();
  } catch (err) {}
};

const getTeamDashboard = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { projectId, startDate, endDate } = req.query;

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Auth check: only team managers/admins/owners or project members can see full dashboard
  const userRole = team.members.find(m => m.user?.toString() === req.user._id.toString())?.role;
  const isManager = ['owner', 'admin', 'manager'].includes(userRole);
  
  // If not in team or not manager, check if workspace admin
  if (!userRole && req.user.role !== 'admin' && req.user.role !== 'owner') {
    throw new ApiError(403, 'Unauthorized to view this team dashboard');
  }

  const now = new Date();
  const startOfWeek = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const endOfWeek = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()), 23, 59, 59);

  // Cache key
  const cacheKey = `${teamId}:${projectId || 'all'}:${startOfWeek.toISOString()}:${endOfWeek.toISOString()}:${isManager ? 'manager' : 'member'}`;
  
  if (dashboardCache.has(cacheKey)) {
    const cached = dashboardCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 300000) { // 5 minutes TTL
      return res.status(200).json(new ApiResponse(200, cached.data, 'Dashboard fetched from cache'));
    }
  }

  // Get project ids belonging to this team
  const projectQuery = { team: teamId };
  if (projectId) {
    projectQuery._id = projectId;
  }
  const projects = await Project.find(projectQuery);
  const projectIds = projects.map(p => p._id);

  // If no projects, return empty dashboard state
  if (projectIds.length === 0) {
    const emptyState = {
      overview: { memberCount: team.members.length, activeTasks: 0, overdueTasks: 0, dueTodayTasks: 0, completedThisWeek: 0, blockedTasks: 0 },
      memberWorkload: [],
      overdueTasks: [],
      blockedTasks: [],
      projects: [],
      attentionItems: []
    };
    return res.status(200).json(new ApiResponse(200, emptyState, 'Dashboard loaded (empty)'));
  }

  // Overview calculations
  const activeTasksCount = await Task.countDocuments({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    isRecurringTemplate: { $ne: true }
  });

  const overdueTasksCount = await Task.countDocuments({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    dueDate: { $lt: now },
    isRecurringTemplate: { $ne: true }
  });

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const dueTodayCount = await Task.countDocuments({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    dueDate: { $gte: startOfToday, $lte: endOfToday },
    isRecurringTemplate: { $ne: true }
  });

  const completedThisWeekCount = await Task.countDocuments({
    project: { $in: projectIds },
    status: 'Done',
    updatedAt: { $gte: startOfWeek, $lte: endOfWeek },
    isRecurringTemplate: { $ne: true }
  });

  const blockedTasksCount = await Task.countDocuments({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    $or: [{ status: 'Blocked' }, { hasBlockers: true }],
    isRecurringTemplate: { $ne: true }
  });

  // Overdue and Blocked Lists (limit 10)
  const overdueTasksList = await Task.find({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    dueDate: { $lt: now },
    isRecurringTemplate: { $ne: true }
  })
    .limit(10)
    .populate('assignedTo', '_id name avatar email')
    .populate('project', '_id name color');

  const blockedTasksList = await Task.find({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    $or: [{ status: 'Blocked' }, { hasBlockers: true }],
    isRecurringTemplate: { $ne: true }
  })
    .limit(10)
    .populate('assignedTo', '_id name avatar email')
    .populate('project', '_id name color');

  // Member Workload Table
  const memberWorkload = [];
  
  if (isManager || req.user.role === 'admin' || req.user.role === 'owner') {
    // Managers can see all members breakdowns
    for (const m of team.members) {
      const user = await User.findById(m.user).select('_id name avatar email username');
      if (!user) continue;

      const working = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: 'In Progress' });
      const todo = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: { $in: ['Todo', 'Backlog', 'Review'] } });
      const overdue = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: { $ne: 'Done' }, dueDate: { $lt: now } });
      const blocked = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: { $ne: 'Done' }, $or: [{ status: 'Blocked' }, { hasBlockers: true }] });
      const completed = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: 'Done', updatedAt: { $gte: startOfWeek, $lte: endOfWeek } });

      // Note: presence checking is handled via Socket onlineUsers state on the client side,
      // but we populate a placeholder or verify online users if required. We will pass a standard layout
      memberWorkload.push({
        user,
        role: m.role,
        working,
        todo,
        overdue,
        blocked,
        completedThisWeek: completed
      });
    }
  } else {
    // Non-managers only see their own breakdown row for privacy
    const user = await User.findById(req.user._id).select('_id name avatar email username');
    if (user) {
      const working = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: 'In Progress' });
      const todo = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: { $in: ['Todo', 'Backlog', 'Review'] } });
      const overdue = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: { $ne: 'Done' }, dueDate: { $lt: now } });
      const blocked = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: { $ne: 'Done' }, $or: [{ status: 'Blocked' }, { hasBlockers: true }] });
      const completed = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: 'Done', updatedAt: { $gte: startOfWeek, $lte: endOfWeek } });

      memberWorkload.push({
        user,
        role: 'member',
        working,
        todo,
        overdue,
        blocked,
        completedThisWeek: completed
      });
    }
  }

  // Project cards status
  const projectCards = [];
  for (const proj of projects) {
    const total = await Task.countDocuments({ project: proj._id, isRecurringTemplate: { $ne: true } });
    const completed = await Task.countDocuments({ project: proj._id, status: 'Done', isRecurringTemplate: { $ne: true } });
    const overdue = await Task.countDocuments({ project: proj._id, status: { $ne: 'Done' }, dueDate: { $lt: now }, isRecurringTemplate: { $ne: true } });
    
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Status heuristics
    let projectStatus = proj.status || 'active';
    if (overdue > 3) {
      projectStatus = 'at_risk';
    }

    projectCards.push({
      project: { _id: proj._id, name: proj.name, color: proj.color, dueDate: proj.dueDate },
      taskCount: total,
      completedCount: completed,
      overdueCount: overdue,
      progress,
      status: projectStatus
    });
  }

  // Attention items computation
  const attentionItems = [];

  // Rule 1: Tasks overdue by more than 3 days
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const longOverdueTasks = await Task.find({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    dueDate: { $lt: threeDaysAgo },
    isRecurringTemplate: { $ne: true }
  }).limit(5);

  longOverdueTasks.forEach(t => {
    attentionItems.push({
      type: 'long_overdue',
      message: `Task "${t.title}" is overdue for more than 3 days.`,
      severity: 'critical',
      taskId: t._id
    });
  });

  // Rule 2: Members with > 7 in-progress tasks (high load)
  for (const row of memberWorkload) {
    if (row.working > 7) {
      attentionItems.push({
        type: 'high_load',
        message: `${row.user.name} has ${row.working} tasks currently in progress (high load).`,
        severity: 'warning'
      });
    }
  }

  // Rule 3: Blocked tasks older than 3 days
  const blockedThreeDaysAgo = await Task.find({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    $or: [{ status: 'Blocked' }, { hasBlockers: true }],
    updatedAt: { $lt: threeDaysAgo },
    isRecurringTemplate: { $ne: true }
  }).limit(5);

  blockedThreeDaysAgo.forEach(t => {
    attentionItems.push({
      type: 'blocked_stall',
      message: `Task "${t.title}" has been blocked/stalled for more than 3 days.`,
      severity: 'critical',
      taskId: t._id
    });
  });

  // Rule 4: Tasks with no assignee due within 2 days
  const twoDaysHence = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const unassignedImminentTasks = await Task.find({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    assignedTo: null,
    dueDate: { $gte: startOfToday, $lte: twoDaysHence },
    isRecurringTemplate: { $ne: true }
  }).limit(5);

  unassignedImminentTasks.forEach(t => {
    attentionItems.push({
      type: 'unassigned_due',
      message: `Unassigned task "${t.title}" is due within 2 days.`,
      severity: 'warning',
      taskId: t._id
    });
  });

  // Rule 5: Projects past their due date with incomplete tasks
  for (const proj of projects) {
    if (proj.dueDate && new Date(proj.dueDate) < now) {
      const incompleteCount = await Task.countDocuments({
        project: proj._id,
        status: { $ne: 'Done' },
        isRecurringTemplate: { $ne: true }
      });
      if (incompleteCount > 0) {
        attentionItems.push({
          type: 'project_past_due',
          message: `Project "${proj.name}" is past its due date but has ${incompleteCount} incomplete tasks remaining.`,
          severity: 'critical'
        });
      }
    }
  }

  const dashboardData = {
    overview: {
      memberCount: team.members.length,
      activeTasks: activeTasksCount,
      overdueTasks: overdueTasksCount,
      dueTodayTasks: dueTodayCount,
      completedThisWeek: completedThisWeekCount,
      blockedTasks: blockedTasksCount
    },
    memberWorkload,
    overdueTasks: overdueTasksList,
    blockedTasks: blockedTasksList,
    projects: projectCards,
    attentionItems
  };

  // Set cache
  dashboardCache.set(cacheKey, {
    timestamp: Date.now(),
    data: dashboardData
  });

  res.status(200).json(new ApiResponse(200, dashboardData, 'Dashboard fetched successfully'));
});

const getMemberTasks = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;

  const team = await Team.findById(teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Auth: only managers can inspect other member's detailed task lists
  const userRole = team.members.find(m => m.user?.toString() === req.user._id.toString())?.role;
  const isManager = ['owner', 'admin', 'manager'].includes(userRole) || req.user.role === 'admin' || req.user.role === 'owner';
  
  if (!isManager && req.user._id.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized to inspect user task lists');
  }

  const projects = await Project.find({ team: teamId });
  const projectIds = projects.map(p => p._id);

  const tasks = await Task.find({
    project: { $in: projectIds },
    assignedTo: userId,
    isRecurringTemplate: { $ne: true }
  }).populate('project', 'name color');

  res.status(200).json(new ApiResponse(200, tasks, 'Member tasks fetched successfully'));
});

module.exports = {
  getTeamDashboard,
  getMemberTasks,
  clearDashboardCache
};
