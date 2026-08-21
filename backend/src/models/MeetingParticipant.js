const mongoose = require('mongoose');

const meetingParticipantSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant'
    },
    joinedAt: { type: Date, default: null },
    leftAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['invited', 'waiting', 'joined', 'left', 'rejected'],
      default: 'invited'
    },
    isMuted: { type: Boolean, default: false },
    isCameraOn: { type: Boolean, default: true },
    isScreenSharing: { type: Boolean, default: false }
  },
  { timestamps: true }
);

meetingParticipantSchema.index({ meeting: 1 });
meetingParticipantSchema.index({ meeting: 1, user: 1 }, { unique: true });
meetingParticipantSchema.index({ user: 1, joinedAt: -1 });

const MeetingParticipant = mongoose.model('MeetingParticipant', meetingParticipantSchema);
module.exports = MeetingParticipant;
