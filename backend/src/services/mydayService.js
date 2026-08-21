const Task = require('../models/Task');
const Event = require('../models/Event');
const Reminder = require('../models/Reminder');

const getMyDayData = async (dateVal, userId) => {
  try {
    // dateVal could be a Date object (from Zod coerce) or a string — normalise to Date
    const D = dateVal instanceof Date ? new Date(dateVal.getTime()) : new Date(dateVal);
    
    if (isNaN(D.getTime())) {
      throw new Error(`Invalid dateVal passed to getMyDayData: ${dateVal}`);
    }

    // Build day boundaries in UTC
    const todayStart = new Date(D);
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayEnd = new Date(D);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);

    // 1. Fetch Today Tasks
    const todayTasks = await Task.find({
      $and: [
        {
          $or: [
            { createdBy: userId },
            { assignedTo: userId }
          ]
        },
        {
          $or: [
            { dueDate: { $gte: todayStart, $lte: todayEnd } },
            { startDate: { $gte: todayStart, $lte: todayEnd } },
            { myDayDate: { $gte: todayStart, $lte: todayEnd } }
          ]
        }
      ]
    }).populate('assignedTo', 'name avatar');

    // 2. Fetch Today Events
    const todayEvents = await Event.find({
      $and: [
        {
          $or: [
            { creator: userId },
            { participants: userId }
          ]
        },
        {
          startDateTime: { $lte: todayEnd },
          endDateTime: { $gte: todayStart }
        }
      ]
    }).populate('creator', 'name avatar').populate('participants', 'name avatar').populate('meetingId');

    // 3. Fetch Today Reminders
    const todayReminders = await Reminder.find({
      creator: userId,
      reminderDateTime: { $gte: todayStart, $lte: todayEnd }
    });

    // 4. Fetch Tomorrow Tasks
    const tomorrowTasks = await Task.find({
      $and: [
        {
          $or: [
            { createdBy: userId },
            { assignedTo: userId }
          ]
        },
        {
          $or: [
            { dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd } },
            { startDate: { $gte: tomorrowStart, $lte: tomorrowEnd } },
            { myDayDate: { $gte: tomorrowStart, $lte: tomorrowEnd } }
          ]
        }
      ]
    }).select('title dueDate startDate myDayDate priority status');

    // 5. Fetch Tomorrow Events
    const tomorrowEvents = await Event.find({
      $and: [
        {
          $or: [
            { creator: userId },
            { participants: userId }
          ]
        },
        {
          startDateTime: { $lte: tomorrowEnd },
          endDateTime: { $gte: tomorrowStart }
        }
      ]
    }).select('title startDateTime endDateTime location');

    // 6. Fetch Overdue Tasks
    const overdueTasks = await Task.find({
      $and: [
        {
          $or: [
            { createdBy: userId },
            { assignedTo: userId }
          ]
        },
        {
          dueDate: { $lt: todayStart },
          status: { $ne: 'Done' }
        }
      ]
    }).populate('assignedTo', 'name avatar');

    // Calculate summary counts
    const summary = {
      urgent: 0,
      high: 0,
      normal: 0,
      low: 0,
      overdue: overdueTasks.length
    };

    todayTasks.forEach(task => {
      const priority = (task.priority || 'Medium').toLowerCase();
      if (priority === 'urgent') summary.urgent++;
      else if (priority === 'high') summary.high++;
      else if (priority === 'medium') summary.normal++;
      else if (priority === 'low') summary.low++;
    });

    // Build timeline list
    const timeline = [];

    todayEvents.forEach(event => {
      const time = event.startDateTime ? new Date(event.startDateTime).toISOString().slice(11, 16) : null;
      timeline.push({
        type: 'event',
        time,
        item: event
      });
    });

    todayTasks.forEach(task => {
      const time = task.dueDate ? new Date(task.dueDate).toISOString().slice(11, 16) : null;
      timeline.push({
        type: 'task',
        time,
        item: task
      });
    });

    todayReminders.forEach(reminder => {
      const time = reminder.reminderDateTime ? new Date(reminder.reminderDateTime).toISOString().slice(11, 16) : null;
      timeline.push({
        type: 'reminder',
        time,
        item: reminder
      });
    });

    // Sort timeline chronologically — timed items first, then untimed by title
    timeline.sort((a, b) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return a.item.title.localeCompare(b.item.title);
    });

    // Build tomorrow array
    const tomorrow = [
      ...tomorrowEvents.map(e => ({ type: 'event', title: e.title, time: e.startDateTime ? new Date(e.startDateTime).toISOString().slice(11, 16) : null, item: e })),
      ...tomorrowTasks.map(t => ({ type: 'task', title: t.title, time: t.dueDate ? new Date(t.dueDate).toISOString().slice(11, 16) : null, item: t }))
    ];

    tomorrow.sort((a, b) => {
      if (a.time && !b.time) return -1;
      if (!a.time && b.time) return 1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return a.title.localeCompare(b.title);
    });

    const dateStr = D.toISOString().split('T')[0];

    return {
      date: dateStr,
      summary,
      timeline,
      overdue: overdueTasks,
      tomorrow
    };
  } catch (err) {
    console.error('[mydayService.getMyDayData] Error:', err);
    throw err;
  }
};

const addToMyDay = async (taskId, dateVal, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, $or: [{ createdBy: userId }, { assignedTo: userId }] },
    { myDayDate: new Date(dateVal) },
    { new: true }
  );
  return task;
};

const removeFromMyDay = async (taskId, userId) => {
  const task = await Task.findOneAndUpdate(
    { _id: taskId, $or: [{ createdBy: userId }, { assignedTo: userId }] },
    { myDayDate: null },
    { new: true }
  );
  return task;
};

module.exports = {
  getMyDayData,
  addToMyDay,
  removeFromMyDay
};
