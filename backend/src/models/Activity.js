const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      enum: [
        'created',
        'assigned',
        'unassigned',
        'status_changed',
        'due_date_changed',
        'priority_changed',
        'member_added',
        'member_removed',
        'subtask_added',
        'subtask_completed',
        'completed',
        'reopened',
        'description_changed',
        'title_changed',
        'attachment_added'
      ],
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ task: 1, createdAt: 1 });
activitySchema.index({ task: 1, action: 1, createdAt: 1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
