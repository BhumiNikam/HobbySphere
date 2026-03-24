const rateLimit = require('express-rate-limit');

/* ===============================
   ENV CHECK
================================ */
const isDevelopment = process.env.NODE_ENV !== 'production';

/* ===============================
   COMMON CONFIG
================================ */
const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
};

/* ===============================
   GENERAL API LIMITER
================================ */
const apiLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 150, // relaxed dev, safe prod
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests, please try again later',
      retryAfter: 15 * 60, // seconds
    });
  },
});

/* ===============================
   AUTH LIMITER (LOGIN / OTP)
================================ */
const authLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // strict in production
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      message:
        'Too many failed login attempts. Please try again after 15 minutes.',
      retryAfter: 15 * 60,
    });
  },
});

/* ===============================
   POST CREATION LIMITER
================================ */
const postLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 50 : 5, // prevent spam
  handler: (req, res) => {
    res.status(429).json({
      message: 'You are posting too fast. Please slow down.',
      retryAfter: 60,
    });
  },
});

/* ===============================
   GUEST LOGIN LIMITER
   Separate from authLimiter because:
   - Guest accounts have no sensitive data to brute-force
   - skipSuccessfulRequests: false ensures a client timeout + retry
     doesn't eat into the limit and cause a false "too many attempts"
   - Higher max allows normal demo/testing traffic
================================ */
const guestLimiter = rateLimit({
  ...commonOptions,
  windowMs: 60 * 1000, // 1 minute window
  max: isDevelopment ? 100 : 20, // 20 guest logins/min is plenty in prod
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many guest login attempts. Please wait a moment.',
      retryAfter: 60,
    });
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  postLimiter,
  guestLimiter,
};