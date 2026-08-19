const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../validators/authValidator');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAll);

router.get('/me', protect, authController.getMe);
router.patch('/me', protect, validate(updateProfileSchema), authController.updateProfile);
router.patch('/change-password', protect, validate(changePasswordSchema), authController.changePassword);

module.exports = router;
