const express = require('express');
const calendarController = require('../controllers/calendarController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { getCalendarSchema } = require('../validators/calendarValidator');

const router = express.Router();

router.use(protect);

router.get('/', validate(getCalendarSchema, 'query'), calendarController.getCalendarData);

module.exports = router;
