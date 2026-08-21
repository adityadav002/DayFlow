const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/ice-config', meetingController.getIceConfig);
router.post('/initiate', meetingController.initiateMeeting);
router.get('/active', meetingController.getActiveMeetings);
router.get('/:id', meetingController.getMeetingDetails);
router.post('/:id/accept', meetingController.acceptMeeting);
router.post('/:id/decline', meetingController.declineMeeting);
router.post('/:id/leave', meetingController.leaveMeeting);

module.exports = router;
