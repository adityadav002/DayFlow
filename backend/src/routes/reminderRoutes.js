const express = require('express');
const reminderController = require('../controllers/reminderController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createReminderSchema, updateReminderSchema } = require('../validators/reminderValidator');

const router = express.Router();

router.use(protect);

router.post('/', validate(createReminderSchema), reminderController.createReminder);
router.get('/', reminderController.getReminders);
router.get('/:id', reminderController.getReminderById);
router.put('/:id', validate(updateReminderSchema), reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.patch('/:id/complete', reminderController.toggleComplete);

module.exports = router;
