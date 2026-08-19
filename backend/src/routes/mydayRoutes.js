const express = require('express');
const mydayController = require('../controllers/mydayController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { getMyDayQuerySchema, addRemoveMyDaySchema } = require('../validators/mydayValidator');

const router = express.Router();

router.use(protect);

router.get('/', validate(getMyDayQuerySchema, 'query'), mydayController.getMyDayData);
router.post('/add', validate(addRemoveMyDaySchema, 'body'), mydayController.addToMyDay);
router.delete('/remove', validate(addRemoveMyDaySchema, 'body'), mydayController.removeFromMyDay);

module.exports = router;
