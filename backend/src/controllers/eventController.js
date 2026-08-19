const eventService = require('../services/eventService');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, event, 'Event created successfully'));
});

const getEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getEvents(req.query, req.user._id);
  res.status(200).json(new ApiResponse(200, events, 'Events fetched successfully'));
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, event, 'Event fetched successfully'));
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, event, 'Event updated successfully'));
});

const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, {}, 'Event deleted successfully'));
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
