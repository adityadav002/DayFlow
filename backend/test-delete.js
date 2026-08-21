require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const Task = require('./src/models/Task');
    // We will just find a task and trace what deleteTask does
    const task = await Task.findOne();
    if (!task) {
      console.log('No task found to test');
      process.exit(0);
    }
    console.log('Found task:', task._id);

    // Let's manually run the EXACT code from taskService.deleteTask
    const taskId = task._id;
    const userId = task.createdBy;
    const deleteScope = 'this';

    console.log('[DEBUG] task found');

    const boardId = task.boardId;

    try {
      const TaskDependency = require('./src/models/TaskDependency');
      const { createNotification } = require('./src/services/notificationService');
      const { emitToProject } = require('./src/utils/socketEmitter');

      console.log('[DEBUG] before TaskDependency.find');
      const deps = await TaskDependency.find({ blockingTask: taskId });
      console.log('[DEBUG] after TaskDependency.find');

      await TaskDependency.deleteMany({
        $or: [{ blockedTask: taskId }, { blockingTask: taskId }]
      });

      // Loop omitted for brevity
    } catch (err) {
      console.error('Error handling dependency cleanup on task deletion:', err);
    }

    console.log('[DEBUG] before Task.findByIdAndDelete');
    // await Task.findByIdAndDelete(taskId); // DON'T ACTUALLY DELETE FOR NOW, just checking up to here
    console.log('[DEBUG] after Task.findByIdAndDelete');

    const activityService = require('./src/services/activityService');
    console.log('[DEBUG] before logActivity');
    await activityService.logActivity(boardId, taskId, 'TASK_DELETED', userId, { title: task.title });
    console.log('[DEBUG] after logActivity');

    // Controller logic
    console.log('[DEBUG] before socket.getIo');
    const { getIo } = require('./src/config/socket');
    try {
      if (task.boardId) {
        getIo().to(task.boardId.toString()).emit('task:deleted', { taskId });
      }
    } catch (err) {
      console.log('[DEBUG] getIo threw:', err.message);
    }

    console.log('[DEBUG] Success!');
    process.exit(0);
  } catch (err) {
    console.error('[CRASH]', err);
    process.exit(1);
  }
}

run();
