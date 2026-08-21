const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    type: {
      type: String,
      enum: ['audio', 'video', 'direct', 'group', 'team', 'project'],
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
    calendarEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    status: {
      type: String,
      enum: ['waiting', 'active', 'ended'],
      default: 'waiting'
    },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    settings: {
      maxParticipants: { type: Number, default: 6 },
      allowScreenShare: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
      muteOnJoin: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

meetingSchema.index({ createdBy: 1, createdAt: -1 });
meetingSchema.index({ team: 1, status: 1 });
meetingSchema.index({ project: 1, status: 1 });
meetingSchema.index({ status: 1, scheduledAt: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);
module.exports = Meeting;
