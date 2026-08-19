const mongoose = require('mongoose');

const taskDependencySchema = new mongoose.Schema(
  {
    blockedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    blockingTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    }
  },
  {
    timestamps: true
  }
);

taskDependencySchema.index({ blockedTask: 1 });
taskDependencySchema.index({ blockingTask: 1 });
taskDependencySchema.index({ blockedTask: 1, blockingTask: 1 }, { unique: true });

const TaskDependency = mongoose.model('TaskDependency', taskDependencySchema);
module.exports = TaskDependency;
