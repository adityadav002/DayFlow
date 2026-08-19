const mongoose = require('mongoose');

const timeEntrySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      default: ''
    },
    isManual: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

timeEntrySchema.index({ task: 1, user: 1 });
timeEntrySchema.index({ user: 1, createdAt: -1 });
timeEntrySchema.index({ project: 1, createdAt: -1 });
timeEntrySchema.index({ project: 1, user: 1, createdAt: 1 });

const TimeEntry = mongoose.model('TimeEntry', timeEntrySchema);
module.exports = TimeEntry;
