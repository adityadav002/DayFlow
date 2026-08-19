const Reminder = require('../models/Reminder');
const ApiError = require('../utils/ApiError');

const createReminder = async (reminderData, userId) => {
  const reminder = await Reminder.create({
    ...reminderData,
    creator: userId
  });
  return reminder;
};

const getReminders = async (query, userId) => {
  const filter = { creator: userId };

  if (query.startDate && query.endDate) {
    filter.reminderDateTime = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate)
    };
  }

  if (query.context) {
    filter.context = query.context;
  }

  return await Reminder.find(filter).sort({ reminderDateTime: 1 });
};

const getReminderById = async (reminderId, userId) => {
  const reminder = await Reminder.findById(reminderId);

  if (!reminder) {
    throw new ApiError(404, 'Reminder not found');
  }

  if (reminder.creator.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized to view this reminder');
  }

  return reminder;
};

const updateReminder = async (reminderId, updates, userId) => {
  const reminder = await Reminder.findById(reminderId);

  if (!reminder) {
    throw new ApiError(404, 'Reminder not found');
  }

  if (reminder.creator.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the creator can update the reminder');
  }

  Object.keys(updates).forEach((key) => {
    reminder[key] = updates[key];
  });

  await reminder.save();
  return reminder;
};

const deleteReminder = async (reminderId, userId) => {
  const reminder = await Reminder.findById(reminderId);

  if (!reminder) {
    throw new ApiError(404, 'Reminder not found');
  }

  if (reminder.creator.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the creator can delete the reminder');
  }

  await Reminder.findByIdAndDelete(reminderId);
  return true;
};

const toggleComplete = async (reminderId, userId) => {
  const reminder = await Reminder.findById(reminderId);

  if (!reminder) {
    throw new ApiError(404, 'Reminder not found');
  }

  if (reminder.creator.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the creator can complete/incomplete the reminder');
  }

  reminder.isCompleted = !reminder.isCompleted;
  reminder.completedAt = reminder.isCompleted ? new Date() : null;
  await reminder.save();
  return reminder;
};

module.exports = {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  toggleComplete
};
