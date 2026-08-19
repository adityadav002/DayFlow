const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');

const createEvent = async (eventData, userId) => {
  const event = await Event.create({
    ...eventData,
    creator: userId
  });
  return await Event.findById(event._id).populate('creator', 'name avatar').populate('participants', 'name avatar');
};

const getEvents = async (query, userId) => {
  const filter = {
    $or: [
      { creator: userId },
      { participants: userId }
    ]
  };

  if (query.startDate && query.endDate) {
    filter.startDateTime = { $lte: new Date(query.endDate) };
    filter.endDateTime = { $gte: new Date(query.startDate) };
  }

  if (query.context) {
    filter.context = query.context;
  }

  return await Event.find(filter)
    .populate('creator', 'name avatar')
    .populate('participants', 'name avatar')
    .sort({ startDateTime: 1 });
};

const getEventById = async (eventId, userId) => {
  const event = await Event.findById(eventId)
    .populate('creator', 'name avatar')
    .populate('participants', 'name avatar');

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  const isCreator = event.creator._id.toString() === userId.toString();
  const isParticipant = event.participants.some(p => p._id.toString() === userId.toString());

  if (!isCreator && !isParticipant) {
    throw new ApiError(403, 'Unauthorized to view this event');
  }

  return event;
};

const updateEvent = async (eventId, updates, userId) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.creator.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the creator can update the event');
  }

  Object.keys(updates).forEach((key) => {
    event[key] = updates[key];
  });

  await event.save();
  return await Event.findById(eventId).populate('creator', 'name avatar').populate('participants', 'name avatar');
};

const deleteEvent = async (eventId, userId) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.creator.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the creator can delete the event');
  }

  await Event.findByIdAndDelete(eventId);
  return true;
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
