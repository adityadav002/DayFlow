const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const {
  getProjectAnalytics,
  getTeamAnalytics,
  exportProjectAnalyticsCsv,
  exportTeamAnalyticsCsv
} = require('../controllers/analyticsController');

const router = express.Router();

router.use(protect);

router.get('/projects/:id/analytics', getProjectAnalytics);
router.get('/projects/:id/analytics/export', exportProjectAnalyticsCsv);
router.get('/teams/:id/analytics', getTeamAnalytics);
router.get('/teams/:id/analytics/export', exportTeamAnalyticsCsv);

module.exports = router;
