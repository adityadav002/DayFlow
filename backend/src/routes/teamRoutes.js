const express = require('express');
const teamController = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const { requireWorkspaceRole, requireTeamRole } = require('../middlewares/roleMiddleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post('/', requireWorkspaceRole('admin'), teamController.createTeam);
router.get('/', requireWorkspaceRole('member'), teamController.getTeams);
router.get('/:id', requireTeamRole('member'), teamController.getTeamById);
router.put('/:id', requireTeamRole('admin'), teamController.updateTeam);
router.delete('/:id', requireTeamRole('owner'), teamController.deleteTeam);
router.post('/:id/members', requireTeamRole('admin'), teamController.addMember);
router.delete('/:id/members/:uid', requireTeamRole('admin'), teamController.removeMember);

module.exports = router;
