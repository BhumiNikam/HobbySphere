const express = require('express');
const { register, login, getMe, forgotPassword, resetPassword, guestLogin, logout } = require('../controllers/authController');
const { authLimiter, guestLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/guest-login', guestLimiter, guestLogin); // uses relaxed guestLimiter, not authLimiter
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;