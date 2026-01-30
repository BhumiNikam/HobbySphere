const express = require('express');
const { register, login, getMe, forgotPassword, resetPassword, guestLogin, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/guest-login', guestLogin);
router.post('/logout', auth, logout); // New logout route
router.get('/me', auth, getMe);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

module.exports = router;