const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { getTeamDashboard, getMemberTasks } = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/:teamId/dashboard', getTeamDashboard);
router.get('/:teamId/members/:userId/tasks', getMemberTasks);

module.exports = router;
