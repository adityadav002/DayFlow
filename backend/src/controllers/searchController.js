const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const globalSearch = asyncHandler(async (req, res) => {
  const { q, workspaceId } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(200).json(new ApiResponse(200, {
      tasks: { results: [], total: 0 },
      projects: { results: [], total: 0 },
      people: { results: [], total: 0 }
    }, 'Search query too short'));
  }

  const queryStr = q.trim();

  const projectFilter = {
    'members.user': req.user._id
  };
  if (workspaceId) {
    projectFilter.workspace = workspaceId;
  }

  const projects = await Project.find(projectFilter);
  const projectIds = projects.map(p => p._id);

  // 1. Search Tasks
  const taskQuery = {
    project: { $in: projectIds },
    $text: { $search: queryStr }
  };
  const tasksCount = await Task.countDocuments(taskQuery);
  const tasksResults = await Task.find(taskQuery)
    .limit(10)
    .populate('assignedTo', 'name avatar')
    .select('_id title status priority dueDate project');

  // 2. Search Projects
  const projectQuery = {
    _id: { $in: projectIds },
    $text: { $search: queryStr }
  };
  const projectsCount = await Project.countDocuments(projectQuery);
  const projectsResults = await Project.find(projectQuery)
    .limit(10)
    .select('_id name description workspace');

  // 3. Search People
  const peopleIds = new Set();
  projects.forEach(p => {
    p.members.forEach(m => {
      if (m.user && m.user.toString() !== req.user._id.toString()) {
        peopleIds.add(m.user.toString());
      }
    });
  });

  const peopleQuery = {
    _id: { $in: Array.from(peopleIds) },
    $or: [
      { name: { $regex: queryStr, $options: 'i' } },
      { email: { $regex: queryStr, $options: 'i' } },
      { username: { $regex: queryStr, $options: 'i' } }
    ]
  };
  const peopleCount = await User.countDocuments(peopleQuery);
  const peopleResults = await User.find(peopleQuery)
    .limit(10)
    .select('_id name email username avatar');

  res.status(200).json(new ApiResponse(200, {
    tasks: { results: tasksResults, total: tasksCount },
    projects: { results: projectsResults, total: projectsCount },
    people: { results: peopleResults, total: peopleCount }
  }, 'Search completed successfully'));
});

const suggestTags = asyncHandler(async (req, res) => {
  const { q } = req.query;
  
  const projects = await Project.find({ 'members.user': req.user._id });
  const projectIds = projects.map(p => p._id);

  const filter = { project: { $in: projectIds } };
  
  const matchStage = q ? { tags: { $regex: `^${q}`, $options: 'i' } } : { tags: { $ne: null } };

  const results = await Task.aggregate([
    { $match: filter },
    { $unwind: '$tags' },
    { $match: matchStage },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const tags = results.map(r => r._id);
  res.status(200).json(new ApiResponse(200, { tags }, 'Tags suggestion completed successfully'));
});

module.exports = {
  globalSearch,
  suggestTags
};
