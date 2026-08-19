const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: {
    type: String,
    enum: [
      'TASK_ASSIGNED',
      'TASK_DEADLINE_SOON',
      'TASK_OVERDUE',
      'TASK_COMPLETED',
      'MENTION',
      'COMMENT_ADDED',
      'PROJECT_UPDATED',
      'TEAM_MEMBER_ADDED',
      'TEAM_MEMBER_REMOVED',
      'DEADLINE_CHANGED',
      'TASK_UNBLOCKED'
    ],
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  body: { 
    type: String, 
    default: '' 
  },
  entityType: { 
    type: String, 
    enum: ['task', 'project', 'team', 'comment', 'event'] 
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  actor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date, 
    default: null 
  }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
