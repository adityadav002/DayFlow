const express = require('express');
const authRoutes = require('./authRoutes');
const boardRoutes = require('./boardRoutes');
const taskRoutes = require('./taskRoutes');
const commentRoutes = require('./commentRoutes');
const activityRoutes = require('./activityRoutes');
const eventRoutes = require('./eventRoutes');
const reminderRoutes = require('./reminderRoutes');
const calendarRoutes = require('./calendarRoutes');
const mydayRoutes = require('./mydayRoutes');
const workspaceRoutes = require('./workspaceRoutes');
const projectRoutes = require('./projectRoutes');
const notificationRoutes = require('./notificationRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/boards', boardRoutes);
router.use('/tasks', taskRoutes);
router.use('/comments', commentRoutes);
router.use('/activities', activityRoutes);
router.use('/events', eventRoutes);
router.use('/reminders', reminderRoutes);
router.use('/calendar', calendarRoutes);
router.use('/myday', mydayRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/projects', projectRoutes);
router.use('/notifications', notificationRoutes);

const searchRoutes = require('./searchRoutes');
const tagRoutes = require('./tagRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const analyticsRoutes = require('./analyticsRoutes');

router.use('/search', searchRoutes);
router.use('/tags', tagRoutes);
router.use('/teams', dashboardRoutes);
router.use('/', analyticsRoutes);

const { protect } = require('../middlewares/authMiddleware');
const attachmentController = require('../controllers/attachmentController');
router.get('/files/:storedName', protect, attachmentController.downloadFile);

module.exports = router;
