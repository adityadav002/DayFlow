const mongoose = require('mongoose');
const { Schema } = mongoose;
const { CONTEXT_TYPES } = require('../utils/constants');

const ReminderSchema = new Schema({
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
  reminderDateTime: {
    type: Date,
    required: true
  },
  context: {
    type: String,
    enum: CONTEXT_TYPES,
    default: 'personal'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  linkedTask: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  linkedEvent: {
    type: Schema.Types.ObjectId,
    ref: 'Event',
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
  }
}, {
  timestamps: true
});

ReminderSchema.index({ creator: 1, reminderDateTime: 1 });
ReminderSchema.index({ reminderDateTime: 1, isCompleted: 1 });

const Reminder = mongoose.model('Reminder', ReminderSchema);
module.exports = Reminder;
