const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', default: null },
    type: { type: String, enum: ['audio', 'video'], required: true },
    outcome: {
      type: String,
      enum: ['initiated', 'ongoing', 'answered', 'missed', 'rejected', 'cancelled', 'failed', 'ended'],
      required: true
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 }
  },
  { timestamps: true }
);

callLogSchema.index({ from: 1, createdAt: -1 });
callLogSchema.index({ to: 1, createdAt: -1 });

const CallLog = mongoose.model('CallLog', callLogSchema);
module.exports = CallLog;
