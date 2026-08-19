const express = require('express');
const workspaceController = require('../controllers/workspaceController');
const teamRoutes = require('./teamRoutes');
const { protect } = require('../middlewares/authMiddleware');
const { requireWorkspaceRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getWorkspaces);
router.get('/:id', requireWorkspaceRole('member'), workspaceController.getWorkspaceById);
router.put('/:id', requireWorkspaceRole('admin'), workspaceController.updateWorkspace);
router.post('/:id/members', requireWorkspaceRole('admin'), workspaceController.addMember);
router.delete('/:id/members/:uid', requireWorkspaceRole('admin'), workspaceController.removeMember);
router.put('/:id/members/:uid/role', requireWorkspaceRole('admin'), workspaceController.updateMemberRole);

router.use('/:wid/teams', teamRoutes);

module.exports = router;
