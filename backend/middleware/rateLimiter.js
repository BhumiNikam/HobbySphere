const rateLimit = require('express-rate-limit');

// Check if in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// General API rate limiter (very lenient for development)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 1000 for dev, 100 for production
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

// Auth rate limiter (only for failed login attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 10, // 100 for dev, 10 for production
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many login attempts, please try again in 15 minutes',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

// Post creation rate limiter
const postLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isDevelopment ? 50 : 10, // 50 for dev, 10 for production
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many posts, please slow down!',
      retryAfter: 60
    });
  }
});

module.exports = { apiLimiter, authLimiter, postLimiter };