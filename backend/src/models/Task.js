const mongoose = require('mongoose');
const { TASK_STATUS, TASK_PRIORITIES, CONTEXT_TYPES } = require('../utils/constants');

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200
    },
    description: {
      type: String,
      default: ''
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'Medium'
    },
    dueDate: {
      type: Date,
      default: null
    },
    context: {
      type: String,
      enum: CONTEXT_TYPES,
      default: 'work'
    },
    startDate: {
      type: Date,
      default: null
    },
    estimatedDuration: {
      type: Number,  // minutes
      default: null
    },
    actualDuration: {
      type: Number,  // minutes
      default: null
    },
    myDayDate: {
      type: Date,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
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
    parentRecurringTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    isRecurringTemplate: {
      type: Boolean,
      default: false
    },
    nextOccurrenceDate: {
      type: Date,
      default: null
    },
    recurrenceActive: {
      type: Boolean,
      default: true
    },
    occurrenceDate: {
      type: Date,
      default: null
    },
    isOccurrenceSkipped: {
      type: Boolean,
      default: false
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: TASK_STATUS,
      default: 'Todo'
    },
    position: {
      type: Number,
      required: true
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true
    },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    version: {
      type: Number,
      default: 0
    },
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null
    },
    subtaskProgress: {
      total: { type: Number, default: 0 },
      completed: { type: Number, default: 0 }
    },
    blockedReason: {
      type: String,
      default: ''
    },
    hasBlockers: {
      type: Boolean,
      default: false
    },
    blockersCount: {
      type: Number,
      default: 0
    },
    activeTimer: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      startedAt: { type: Date, default: null },
      pausedDuration: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field for comments count
taskSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
  count: true
});

// Indexes for faster querying and position validation
taskSchema.index({ boardId: 1, status: 1, position: 1 });
taskSchema.index({ createdBy: 1, dueDate: 1 });
taskSchema.index({ assignedTo: 1, dueDate: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ startDate: 1 });
taskSchema.index({ myDayDate: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ project: 1, assignedTo: 1, status: 1 });
taskSchema.index({ project: 1, dueDate: 1, status: 1 });
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, createdAt: 1 });
taskSchema.index({ project: 1, status: 1, updatedAt: 1 });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
