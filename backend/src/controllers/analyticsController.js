const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const TimeEntry = require('../models/TimeEntry');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { Parser } = require('json2csv');

// In-memory analytics cache
const analyticsCache = new Map();

const clearAnalyticsCache = () => {
  analyticsCache.clear();
};

const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Auth: only project members can view analytics
  const isMember = project.members.some(m => m.user?.toString() === req.user._id.toString()) || req.user.role === 'admin' || req.user.role === 'owner';
  if (!isMember) {
    throw new ApiError(403, 'Unauthorized to view project analytics');
  }

  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date(now);

  const cacheKey = `project:${id}:${start.toISOString()}:${end.toISOString()}`;
  if (analyticsCache.has(cacheKey)) {
    const cached = analyticsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 600000) { // 10 minutes TTL
      return res.status(200).json(new ApiResponse(200, cached.data, 'Analytics fetched from cache'));
    }
  }

  // 1. Overview counts
  const totalTasks = await Task.countDocuments({ project: id, createdAt: { $gte: start, $lte: end }, isRecurringTemplate: { $ne: true } });
  const completedTasks = await Task.countDocuments({ project: id, status: 'Done', updatedAt: { $gte: start, $lte: end }, isRecurringTemplate: { $ne: true } });
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const overdueTasks = await Task.countDocuments({ project: id, status: { $ne: 'Done' }, dueDate: { $lt: now }, isRecurringTemplate: { $ne: true } });

  // Avg completion days
  const doneTasks = await Task.find({ project: id, status: 'Done', updatedAt: { $gte: start, $lte: end }, isRecurringTemplate: { $ne: true } });
  let totalDays = 0;
  doneTasks.forEach(t => {
    const duration = (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    totalDays += duration;
  });
  const avgCompletionDays = doneTasks.length > 0 ? parseFloat((totalDays / doneTasks.length).toFixed(1)) : 0;

  // 2. Status distribution
  const statusDistribution = {
    backlog: await Task.countDocuments({ project: id, status: 'Backlog', isRecurringTemplate: { $ne: true } }),
    todo: await Task.countDocuments({ project: id, status: 'Todo', isRecurringTemplate: { $ne: true } }),
    in_progress: await Task.countDocuments({ project: id, status: 'In Progress', isRecurringTemplate: { $ne: true } }),
    review: await Task.countDocuments({ project: id, status: 'Review', isRecurringTemplate: { $ne: true } }),
    blocked: await Task.countDocuments({ project: id, status: 'Blocked', isRecurringTemplate: { $ne: true } }) + await Task.countDocuments({ project: id, status: { $ne: 'Done' }, hasBlockers: true, isRecurringTemplate: { $ne: true } }),
    done: await Task.countDocuments({ project: id, status: 'Done', isRecurringTemplate: { $ne: true } })
  };

  // 3. Completion trend (daily group)
  const completionTrend = await Task.aggregate([
    {
      $match: {
        project: project._id,
        status: 'Done',
        updatedAt: { $gte: start, $lte: end },
        isRecurringTemplate: { $ne: true }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
        completed: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const formattedTrend = completionTrend.map(t => ({
    date: t._id,
    completed: t.completed
  }));

  // 4. Time tracking estimation accuracy
  // We sum estimated hours vs actual time tracked
  const tasksWithEst = await Task.find({ project: id, isRecurringTemplate: { $ne: true } });
  let totalEstimated = 0;
  tasksWithEst.forEach(t => {
    totalEstimated += t.estimatedDuration || 0;
  });

  // Calculate actual time tracked via time entry logs
  const timeEntries = await TimeEntry.find({ project: id });
  let totalActual = 0;
  timeEntries.forEach(entry => {
    totalActual += (entry.duration || 0) / 60; // duration is in minutes
  });

  const varianceHours = totalActual - totalEstimated;
  const variancePercent = totalEstimated > 0 ? parseFloat(((varianceHours / totalEstimated) * 100).toFixed(1)) : 0;

  // Estimation by priority
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];
  const byPriority = {};
  for (const pri of priorities) {
    const pTasks = await Task.find({ project: id, priority: pri, isRecurringTemplate: { $ne: true } });
    let pEst = 0;
    pTasks.forEach(t => { pEst += t.estimatedDuration || 0; });

    let pAct = 0;
    const taskIds = pTasks.map(t => t._id);
    const pEntries = await TimeEntry.find({ task: { $in: taskIds } });
    pEntries.forEach(e => { pAct += (e.duration || 0) / 60; });

    const pVariance = pEst > 0 ? parseFloat((((pAct - pEst) / pEst) * 100).toFixed(1)) : 0;
    byPriority[pri.toLowerCase()] = {
      estimated: pEst,
      actual: pAct,
      variancePercent: pVariance
    };
  }

  const analyticsData = {
    period: { startDate: start, endDate: end },
    overview: {
      created: totalTasks,
      completed: completedTasks,
      completionRate,
      overdue: overdueTasks,
      avgCompletionDays
    },
    statusDistribution,
    completionTrend: formattedTrend,
    timeTracking: {
      totalEstimated,
      totalActual,
      variancePercent,
      byPriority
    }
  };

  analyticsCache.set(cacheKey, {
    timestamp: Date.now(),
    data: analyticsData
  });

  res.status(200).json(new ApiResponse(200, analyticsData, 'Project analytics fetched successfully'));
});

const getTeamAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, projectId } = req.query;

  const team = await Team.findById(id);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Auth: only team managers/admins/owners can view analytics
  const userRole = team.members.find(m => m.user?.toString() === req.user._id.toString())?.role;
  const isManager = ['owner', 'admin', 'manager'].includes(userRole) || req.user.role === 'admin' || req.user.role === 'owner';
  
  if (!isManager) {
    throw new ApiError(403, 'Unauthorized to view team analytics');
  }

  const now = new Date();
  const start = startDate ? new Date(startDate) : new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days
  const end = endDate ? new Date(endDate) : new Date(now);

  const cacheKey = `team:${id}:${projectId || 'all'}:${start.toISOString()}:${end.toISOString()}`;
  if (analyticsCache.has(cacheKey)) {
    const cached = analyticsCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 600000) { // 10 minutes TTL
      return res.status(200).json(new ApiResponse(200, cached.data, 'Analytics fetched from cache'));
    }
  }

  const projectQuery = { team: id };
  if (projectId) {
    projectQuery._id = projectId;
  }
  const projects = await Project.find(projectQuery);
  const projectIds = projects.map(p => p._id);

  if (projectIds.length === 0) {
    const emptyState = { throughput: [], completionByMember: [], overdueTrend: [], avgTaskAgeDays: 0 };
    return res.status(200).json(new ApiResponse(200, emptyState, 'Team analytics loaded (empty)'));
  }

  // 1. Throughput: completed tasks per week
  const throughputAgg = await Task.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        status: 'Done',
        updatedAt: { $gte: start, $lte: end },
        isRecurringTemplate: { $ne: true }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%G-W%V', date: '$updatedAt' } }, // ISO week grouping
        completed: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const throughput = throughputAgg.map(t => ({
    week: t._id,
    completed: t.completed
  }));

  // 2. Overdue Trend: overdue task counts per week
  // We approximate overdue trend from historical logs if any, or simply group incomplete overdue tasks by creation week
  const overdueTrendAgg = await Task.aggregate([
    {
      $match: {
        project: { $in: projectIds },
        status: { $ne: 'Done' },
        dueDate: { $lt: now },
        isRecurringTemplate: { $ne: true }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%G-W%V', date: '$dueDate' } },
        overdue: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const overdueTrend = overdueTrendAgg.map(t => ({
    week: t._id,
    overdue: t.overdue
  }));

  // 3. Completion by member
  const completionByMember = [];
  for (const m of team.members) {
    const user = await User.findById(m.user).select('_id name avatar email username');
    if (!user) continue;

    const assigned = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, isRecurringTemplate: { $ne: true } });
    const completed = await Task.countDocuments({ project: { $in: projectIds }, assignedTo: user._id, status: 'Done', isRecurringTemplate: { $ne: true } });
    const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

    completionByMember.push({
      user,
      assigned,
      completed,
      rate
    });
  }

  // 4. Average task age: days since creation for incomplete tasks
  const incompleteTasks = await Task.find({ project: { $in: projectIds }, status: { $ne: 'Done' }, isRecurringTemplate: { $ne: true } });
  let totalAgeDays = 0;
  incompleteTasks.forEach(t => {
    const age = (now.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    totalAgeDays += age;
  });
  const avgTaskAgeDays = incompleteTasks.length > 0 ? Math.round(totalAgeDays / incompleteTasks.length) : 0;

  const teamAnalyticsData = {
    throughput,
    completionByMember,
    overdueTrend,
    avgTaskAgeDays
  };

  analyticsCache.set(cacheKey, {
    timestamp: Date.now(),
    data: teamAnalyticsData
  });

  res.status(200).json(new ApiResponse(200, teamAnalyticsData, 'Team analytics fetched successfully'));
});

const exportProjectAnalyticsCsv = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Auth: project members only
  const isMember = project.members.some(m => m.user?.toString() === req.user._id.toString()) || req.user.role === 'admin' || req.user.role === 'owner';
  if (!isMember) {
    throw new ApiError(403, 'Unauthorized to export project analytics');
  }

  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  const tasks = await Task.find({
    project: id,
    createdAt: { $gte: start, $lte: end },
    isRecurringTemplate: { $ne: true }
  }).populate('assignedTo', 'name email');

  const fields = [
    { label: 'Task Title', value: 'title' },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Assignee Name', value: 'assignedTo.name' },
    { label: 'Assignee Email', value: 'assignedTo.email' },
    { label: 'Created At', value: 'createdAt' },
    { label: 'Completed At', value: 'updatedAt' },
    { label: 'Estimated Hours', value: 'estimatedDuration' },
    { label: 'Actual Hours', value: 'actualHours' } // We will calculate this below
  ];

  // Calculate actual hours for each task
  const formattedTasks = [];
  for (const task of tasks) {
    const entries = await TimeEntry.find({ task: task._id });
    let totalMinutes = 0;
    entries.forEach(e => { totalMinutes += e.duration || 0; });
    
    formattedTasks.push({
      title: task.title,
      status: task.status,
      priority: task.priority || 'Medium',
      assignedTo: task.assignedTo ? { name: task.assignedTo.name, email: task.assignedTo.email } : { name: 'Unassigned', email: 'N/A' },
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.status === 'Done' ? task.updatedAt.toISOString() : 'N/A',
      estimatedDuration: task.estimatedDuration || 0,
      actualHours: parseFloat((totalMinutes / 60).toFixed(2))
    });
  }

  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(formattedTasks);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=project_${project.name.replace(/\s+/g, '_')}_tasks.csv`);
  res.status(200).send(csv);
});

const exportTeamAnalyticsCsv = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, projectId } = req.query;

  const team = await Team.findById(id);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  // Auth: managers only
  const userRole = team.members.find(m => m.user?.toString() === req.user._id.toString())?.role;
  const isManager = ['owner', 'admin', 'manager'].includes(userRole) || req.user.role === 'admin' || req.user.role === 'owner';
  
  if (!isManager) {
    throw new ApiError(403, 'Unauthorized to export team analytics');
  }

  const projectQuery = { team: id };
  if (projectId) {
    projectQuery._id = projectId;
  }
  const projects = await Project.find(projectQuery);
  const projectIds = projects.map(p => p._id);

  const start = startDate ? new Date(startDate) : new Date(0);
  const end = endDate ? new Date(endDate) : new Date();

  const tasks = await Task.find({
    project: { $in: projectIds },
    createdAt: { $gte: start, $lte: end },
    isRecurringTemplate: { $ne: true }
  }).populate('assignedTo', 'name email').populate('project', 'name');

  const fields = [
    { label: 'Project Name', value: 'project.name' },
    { label: 'Task Title', value: 'title' },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Assignee Name', value: 'assignedTo.name' },
    { label: 'Assignee Email', value: 'assignedTo.email' },
    { label: 'Created At', value: 'createdAt' },
    { label: 'Completed At', value: 'updatedAt' },
    { label: 'Estimated Hours', value: 'estimatedDuration' },
    { label: 'Actual Hours', value: 'actualHours' }
  ];

  const formattedTasks = [];
  for (const task of tasks) {
    const entries = await TimeEntry.find({ task: task._id });
    let totalMinutes = 0;
    entries.forEach(e => { totalMinutes += e.duration || 0; });
    
    formattedTasks.push({
      project: { name: task.project?.name || 'Unknown Project' },
      title: task.title,
      status: task.status,
      priority: task.priority || 'Medium',
      assignedTo: task.assignedTo ? { name: task.assignedTo.name, email: task.assignedTo.email } : { name: 'Unassigned', email: 'N/A' },
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.status === 'Done' ? task.updatedAt.toISOString() : 'N/A',
      estimatedDuration: task.estimatedDuration || 0,
      actualHours: parseFloat((totalMinutes / 60).toFixed(2))
    });
  }

  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(formattedTasks);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=team_${team.name.replace(/\s+/g, '_')}_tasks.csv`);
  res.status(200).send(csv);
});

module.exports = {
  getProjectAnalytics,
  getTeamAnalytics,
  exportProjectAnalyticsCsv,
  exportTeamAnalyticsCsv,
  clearAnalyticsCache
};
