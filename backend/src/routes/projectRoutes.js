const express = require('express');
const projectController = require('../controllers/projectController');
const { protect } = require('../middlewares/authMiddleware');
const { requireProjectRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', requireProjectRole('member'), projectController.getProjectById);
router.get('/:id/tasks', requireProjectRole('member'), projectController.getProjectTasks);
router.put('/:id', requireProjectRole('manager'), projectController.updateProject);
router.delete('/:id', requireProjectRole('admin'), projectController.deleteProject);
router.post('/:id/members', requireProjectRole('manager'), projectController.addMember);
router.delete('/:id/members/:uid', requireProjectRole('admin'), projectController.removeMember);
router.put('/:id/members/:uid/role', requireProjectRole('admin'), projectController.updateMemberRole);
const attachmentRoutes = require('./attachmentRoutes');
router.use('/:id/attachments', requireProjectRole('member'), attachmentRoutes);

module.exports = router;
