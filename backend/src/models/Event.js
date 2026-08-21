const mongoose = require('mongoose');
const { Schema } = mongoose;
const { CONTEXT_TYPES } = require('../utils/constants');

const EventSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  team: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  startDateTime: {
    type: Date,
    required: true
  },
  endDateTime: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    default: ''
  },
  context: {
    type: String,
    enum: CONTEXT_TYPES,
    default: 'work'
  },
  color: {
    type: String,
    default: null
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceRule: {
    frequency: { type: String, default: null },
    interval: { type: Number, default: null },
    daysOfWeek: { type: [Number], default: [] },
    dayOfMonth: { type: Number, default: null },
    endDate: { type: Date, default: null },
    occurrenceCount: { type: Number, default: null },
    timezone: { type: String, default: null }
  },
  parentRecurringEvent: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
    default: null
  },
  meetingId: {
    type: Schema.Types.ObjectId,
    ref: 'Meeting',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for calendar queries
EventSchema.index({ creator: 1, startDateTime: 1 });
EventSchema.index({ participants: 1, startDateTime: 1 });
EventSchema.index({ startDateTime: 1, endDateTime: 1 });

const Event = mongoose.model('Event', EventSchema);
module.exports = Event;
