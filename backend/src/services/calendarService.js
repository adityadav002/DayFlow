const Task = require('../models/Task');
const Event = require('../models/Event');
const Reminder = require('../models/Reminder');

const getCalendarData = async ({ startDate, endDate, context, types, teamId }, userId) => {
  const typeList = types ? types.split(',') : ['tasks', 'events', 'reminders'];
  
  const results = {
    tasks: [],
    events: [],
    reminders: []
  };

  let memberIds = [userId];
  if (teamId) {
    const Team = require('../models/Team');
    const team = await Team.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    const isMember = team.members.some(m => m.user?.toString() === userId.toString());
    if (!isMember) {
      throw new Error('Unauthorized to access team calendar');
    }
    memberIds = team.members.map(m => m.user).filter(Boolean);
  }

  const promises = [];

  if (typeList.includes('tasks')) {
    const taskFilter = {
      $and: [
        {
          $or: [
            { createdBy: { $in: memberIds } },
            { assignedTo: { $in: memberIds } }
          ]
        },
        {
          $or: [
            { dueDate: { $gte: startDate, $lte: endDate } },
            { startDate: { $gte: startDate, $lte: endDate } }
          ]
        }
      ]
    };
    if (context) {
      taskFilter.$and.push({ context });
    }
    promises.push(
      Task.find(taskFilter)
        .populate('assignedTo', 'name avatar')
        .sort({ position: 1 })
        .then(res => { results.tasks = res; })
    );
  }

  if (typeList.includes('events')) {
    const eventFilter = {
      $and: [
        {
          $or: [
            { creator: { $in: memberIds } },
            { participants: { $in: memberIds } }
          ]
        },
        {
          startDateTime: { $lte: endDate },
          endDateTime: { $gte: startDate }
        }
      ]
    };
    if (context) {
      eventFilter.$and.push({ context });
    }
    promises.push(
      Event.find(eventFilter)
        .populate('creator', 'name avatar')
        .populate('participants', 'name avatar')
        .sort({ startDateTime: 1 })
        .then(res => { results.events = res; })
    );
  }

  if (typeList.includes('reminders')) {
    const reminderFilter = {
      creator: { $in: memberIds },
      reminderDateTime: { $gte: startDate, $lte: endDate }
    };
    if (context) {
      reminderFilter.context = context;
    }
    promises.push(
      Reminder.find(reminderFilter)
        .sort({ reminderDateTime: 1 })
        .then(res => { results.reminders = res; })
    );
  }

  await Promise.all(promises);
  return results;
};

module.exports = {
  getCalendarData
};
