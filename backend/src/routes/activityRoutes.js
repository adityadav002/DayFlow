const express = require('express');
const activityController = require('../controllers/activityController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/', activityController.getTaskActivity);

module.exports = router;
