const Event = require('../models/Event');
const Meeting = require('../models/Meeting');
const ApiError = require('../utils/ApiError');

const createEvent = async (eventData, userId) => {
  let meetingId = null;
  if (eventData.isMeeting) {
    const meeting = await Meeting.create({
      title: eventData.title,
      createdBy: userId,
      type: eventData.meetingType || 'video',
      status: 'waiting',
      scheduledAt: eventData.startDateTime,
      project: eventData.project || null
    });
    
    if (eventData.participants && eventData.participants.length > 0) {
      const MeetingParticipant = require('../models/MeetingParticipant');
      const participantsData = eventData.participants.map(id => ({
        meeting: meeting._id,
        user: id,
        status: 'invited'
      }));
      participantsData.push({
        meeting: meeting._id,
        user: userId,
        status: 'joined',
        joinedAt: new Date()
      });
      await MeetingParticipant.insertMany(participantsData);
    } else {
      const MeetingParticipant = require('../models/MeetingParticipant');
      await MeetingParticipant.create({
        meeting: meeting._id,
        user: userId,
        status: 'joined',
        joinedAt: new Date()
      });
    }
    
    meetingId = meeting._id;
  }

  const event = await Event.create({
    ...eventData,
    creator: userId,
    meetingId
  });
  return await Event.findById(event._id)
    .populate('creator', 'name avatar')
    .populate('participants', 'name avatar')
    .populate('meetingId');
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
  
  if (query.projectId) {
    filter.project = query.projectId;
  }

  return await Event.find(filter)
    .populate('creator', 'name avatar')
    .populate('participants', 'name avatar')
    .populate('meetingId')
    .sort({ startDateTime: 1 });
};

const getEventById = async (eventId, userId) => {
  const event = await Event.findById(eventId)
    .populate('creator', 'name avatar')
    .populate('participants', 'name avatar')
    .populate('meetingId');

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
  return await Event.findById(eventId)
    .populate('creator', 'name avatar')
    .populate('participants', 'name avatar')
    .populate('meetingId');
};

const deleteEvent = async (eventId, userId) => {
  const event = await Event.findById(eventId);

  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  if (event.creator.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the creator can delete the event');
  }

  if (event.meetingId) {
    const MeetingParticipant = require('../models/MeetingParticipant');
    await Meeting.findByIdAndDelete(event.meetingId);
    await MeetingParticipant.deleteMany({ meeting: event.meetingId });
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
