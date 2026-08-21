const mongoose = require('mongoose');
const Meeting = require('../models/Meeting');
const MeetingParticipant = require('../models/MeetingParticipant');
const CallLog = require('../models/CallLog');
const Notification = require('../models/Notification');
const { getIo } = require('../config/socket');

// @desc    Get ICE Configuration (STUN/TURN)
// @route   GET /api/meetings/ice-config
// @access  Private
exports.getIceConfig = async (req, res) => {
  try {
    // Basic STUN servers. TURN servers can be added using process.env
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    
    // Add TURN from env vars if available
    if (process.env.TURN_URL) {
      iceServers.push({
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_PASSWORD,
      });
    }

    res.status(200).json({ iceServers });
  } catch (error) {
    console.error('Error fetching ICE config:', error);
    res.status(500).json({ error: 'Server error fetching ICE config' });
  }
};

// @desc    Initiate a new meeting
// @route   POST /api/meetings/initiate
// @access  Private
exports.initiateMeeting = async (req, res) => {
  const { title, participantIds, type } = req.body;
  const hostId = req.user._id;

  try {
    const meeting = await Meeting.create({
      title: title || 'Video Meeting',
      createdBy: hostId,
      status: 'active',
      type: type || 'video',
      scheduledAt: new Date()
    });

    const participantsData = participantIds.map(id => ({
      meeting: meeting._id,
      user: id,
      status: 'invited'
    }));
    participantsData.push({
      meeting: meeting._id,
      user: hostId,
      status: 'joined',
      joinedAt: new Date()
    });

    await MeetingParticipant.insertMany(participantsData);

    // Initial call log for the host
    await CallLog.create({
      meeting: meeting._id,
      from: hostId,
      to: participantIds[0],
      type: type || 'video',
      outcome: 'initiated'
    });

    const io = getIo();

    // Create notifications and emit socket events for invitees
    const notifications = [];
    for (const id of participantIds) {
      notifications.push({
        recipient: id,
        type: 'MEETING_INVITE',
        title: 'Meeting Invitation',
        body: `${req.user.name || 'Someone'} invited you to a meeting.`,
        entityType: 'meeting',
        entityId: meeting._id,
        actor: hostId
      });
      // Assuming socket uses user:userId for rooms
      io.to(`user:${id.toString()}`).emit('meeting:invitation', {
        meetingId: meeting._id,
        title: meeting.title,
        host: hostId,
        type: meeting.type
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error initiating meeting:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    res.status(500).json({ error: 'Server error initiating meeting' });
  }
};

// @desc    Accept a meeting invitation
// @route   POST /api/meetings/:id/accept
// @access  Private
exports.acceptMeeting = async (req, res) => {
  const meetingId = req.params.id;
  const userId = req.user._id;

  try {
    const participant = await MeetingParticipant.findOneAndUpdate(
      { meeting: meetingId, user: userId },
      { status: 'joined', joinedAt: new Date() },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found for this meeting' });
    }

    await CallLog.findOneAndUpdate(
      { meeting: meetingId },
      { outcome: 'answered', startedAt: new Date() }
    );

    const io = getIo();
    io.to(`meeting_${meetingId}`).emit('meeting:participant_joined', {
      meetingId,
      userId
    });

    res.status(200).json(participant);
  } catch (error) {
    console.error('Error accepting meeting:', error);
    res.status(500).json({ error: 'Server error accepting meeting' });
  }
};

// @desc    Decline a meeting invitation
// @route   POST /api/meetings/:id/decline
// @access  Private
exports.declineMeeting = async (req, res) => {
  const meetingId = req.params.id;
  const userId = req.user._id;

  try {
    const participant = await MeetingParticipant.findOneAndUpdate(
      { meeting: meetingId, user: userId },
      { status: 'declined' },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found for this meeting' });
    }

    await CallLog.findOneAndUpdate(
      { meeting: meetingId },
      { outcome: 'rejected', endedAt: new Date() }
    );

    res.status(200).json(participant);
  } catch (error) {
    console.error('Error declining meeting:', error);
    res.status(500).json({ error: 'Server error declining meeting' });
  }
};

// @desc    Leave an active meeting
// @route   POST /api/meetings/:id/leave
// @access  Private
exports.leaveMeeting = async (req, res) => {
  const meetingId = req.params.id;
  const userId = req.user._id;

  try {
    const participant = await MeetingParticipant.findOneAndUpdate(
      { meeting: meetingId, user: userId },
      { status: 'left', leftAt: new Date() },
      { new: true }
    );

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found for this meeting' });
    }

    const callLog = await CallLog.findOne({ meeting: meetingId });
    if (callLog && callLog.startedAt && !callLog.endedAt) {
      const endedAt = new Date();
      const durationSeconds = Math.floor((endedAt.getTime() - callLog.startedAt.getTime()) / 1000);
      await CallLog.findOneAndUpdate(
        { meeting: meetingId },
        { outcome: 'ended', endedAt, durationSeconds }
      );
    }

    const io = getIo();
    io.to(`meeting_${meetingId}`).emit('meeting:participant_left', {
      meetingId,
      userId
    });

    // Check if no active participants are left to close meeting
    const activeParticipants = await MeetingParticipant.countDocuments({
      meeting: meetingId,
      status: 'joined'
    });

    if (activeParticipants === 0) {
      await Meeting.findByIdAndUpdate(meetingId, {
        status: 'ended',
        endedAt: new Date()
      });
      io.to(`meeting_${meetingId}`).emit('meeting:ended', { meetingId });
    }

    res.status(200).json(participant);
  } catch (error) {
    console.error('Error leaving meeting:', error);
    res.status(500).json({ error: 'Server error leaving meeting' });
  }
};

// @desc    Get active meetings for user
// @route   GET /api/meetings/active
// @access  Private
exports.getActiveMeetings = async (req, res) => {
  const userId = req.user._id;

  try {
    const participantRecords = await MeetingParticipant.find({
      user: userId,
      status: { $in: ['invited', 'joined'] }
    });
    
    const meetingIds = participantRecords.map(p => p.meeting);

    const meetings = await Meeting.find({
      _id: { $in: meetingIds },
      status: 'active'
    }).populate('createdBy', 'name email avatar').lean();

    const mappedMeetings = meetings.map(m => {
      m.host = m.createdBy;
      return m;
    });

    res.status(200).json(mappedMeetings);
  } catch (error) {
    console.error('Error fetching active meetings:', error);
    res.status(500).json({ error: 'Server error fetching active meetings' });
  }
};

// @desc    Get meeting details
// @route   GET /api/meetings/:id
// @access  Private
exports.getMeetingDetails = async (req, res) => {
  const meetingId = req.params.id;
  
  try {
    const meeting = await Meeting.findById(meetingId).populate('createdBy', 'name email avatar').lean();
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    meeting.host = meeting.createdBy;

    const participants = await MeetingParticipant.find({ meeting: meetingId })
      .populate('user', 'name email avatar');

    res.status(200).json({ meeting, participants });
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    res.status(500).json({ error: 'Server error fetching meeting details' });
  }
};
