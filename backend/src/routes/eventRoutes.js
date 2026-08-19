const express = require('express');
const eventController = require('../controllers/eventController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { createEventSchema, updateEventSchema } = require('../validators/eventValidator');

const router = express.Router();

router.use(protect);

router.post('/', validate(createEventSchema), eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.put('/:id', validate(updateEventSchema), eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;
