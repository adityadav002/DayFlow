const express = require('express');
const timeController = require('../controllers/timeController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTaskPermission } = require('../middlewares/roleMiddleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post('/timer/start', requireTaskPermission('edit'), timeController.startTimer);
router.post('/timer/pause', requireTaskPermission('edit'), timeController.pauseTimer);
router.post('/timer/resume', requireTaskPermission('edit'), timeController.resumeTimer);
router.post('/timer/stop', requireTaskPermission('edit'), timeController.stopTimer);
router.get('/timer/status', timeController.getTimerStatus);

router.post('/time-entries', requireTaskPermission('edit'), timeController.logManualTime);
router.get('/time-entries', timeController.getTimeEntries);
router.delete('/time-entries/:eid', timeController.deleteTimeEntry);

module.exports = router;
