const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '' },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'admin', 'manager', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
      default: 'active'
    },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    color: { type: String, default: null },
    icon: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', default: null },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }]
  },
  { timestamps: true }
);

projectSchema.index({ workspace: 1 });
projectSchema.index({ team: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ name: 'text', description: 'text' });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
