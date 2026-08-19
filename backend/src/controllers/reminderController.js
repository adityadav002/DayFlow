const reminderService = require('../services/reminderService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createReminder = asyncHandler(async (req, res) => {
  const reminder = await reminderService.createReminder(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, reminder, 'Reminder created successfully'));
});

const getReminders = asyncHandler(async (req, res) => {
  const reminders = await reminderService.getReminders(req.query, req.user._id);
  res.status(200).json(new ApiResponse(200, reminders, 'Reminders fetched successfully'));
});

const getReminderById = asyncHandler(async (req, res) => {
  const reminder = await reminderService.getReminderById(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, reminder, 'Reminder fetched successfully'));
});

const updateReminder = asyncHandler(async (req, res) => {
  const reminder = await reminderService.updateReminder(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, reminder, 'Reminder updated successfully'));
});

const deleteReminder = asyncHandler(async (req, res) => {
  await reminderService.deleteReminder(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, {}, 'Reminder deleted successfully'));
});

const toggleComplete = asyncHandler(async (req, res) => {
  const reminder = await reminderService.toggleComplete(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, reminder, 'Reminder completion toggled successfully'));
});

module.exports = {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
  toggleComplete
};
