const express = require('express');
const taskController = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { requireBoardMember, requireTaskPermission } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { createTaskSchema, updateTaskSchema, bulkUpdatePositionsSchema } = require('../validators/taskValidator');

const router = express.Router();

router.use(protect);

// Board-scoped tasks
router.get('/board/:boardId', requireBoardMember, taskController.getTasks);
router.post('/board/:boardId', requireBoardMember, validate(createTaskSchema), taskController.createTask);

// Task operations
router.patch('/bulk-positions', validate(bulkUpdatePositionsSchema), taskController.bulkUpdatePositions);

router.patch('/:id', requireTaskPermission('edit'), validate(updateTaskSchema), taskController.updateTask);
router.delete('/:id', requireTaskPermission('delete'), taskController.deleteTask);
router.post('/:id/attachments', requireTaskPermission('edit'), upload.single('file'), taskController.addAttachment);

// Subtask operations
router.get('/:id/subtasks', taskController.getSubtasks);
router.post('/:id/subtasks', requireTaskPermission('edit'), taskController.createSubtask);
router.patch('/:id/subtasks/:sid', requireTaskPermission('edit'), taskController.updateSubtask);
router.patch('/:id/subtasks/:sid/complete', requireTaskPermission('edit'), taskController.completeSubtask);
router.delete('/:id/subtasks/:sid', requireTaskPermission('edit'), taskController.deleteSubtask);
const commentRoutes = require('./commentRoutes');
const activityRoutes = require('./activityRoutes');
const dependencyRoutes = require('./dependencyRoutes');
const attachmentRoutes = require('./attachmentRoutes');
const timeRoutes = require('./timeRoutes');

router.use('/:id/comments', commentRoutes);
router.use('/:id/activity', activityRoutes);
router.use('/:id/dependencies', dependencyRoutes);
router.use('/:id/attachments', attachmentRoutes);
router.use('/:id/time', timeRoutes);

module.exports = router;

