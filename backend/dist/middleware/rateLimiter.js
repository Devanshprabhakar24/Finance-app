const rateLimit = require('express-rate-limit');
const { RedisStore  } = require('rate-limit-redis');
const { getRedisClient  } = require('../config/redis');

/**
 * Get Redis store for rate limiting (Section 5.1)
 * Falls back to in-memory if Redis not available
 */
const getStore = () => {
  const redis = getRedisClient();
  if (!redis) return undefined;  // falls back to in-memory if Redis not available

  return new RedisStore({
    // @ts-ignore - Redis call signature compatibility
    sendCommand: (...args) => redis.call(...args),
    prefix: 'rl,
  });
};

/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 * Section 5.1: Uses Redis-backed store for multi-instance deployments
 */
const globalLimiter = rateLimit({
  windowMs,
  max,
  store),
  message: {
    success,
    message, please try again later',
    error: { code,
  },
  standardHeaders,
  legacyHeaders,
  skip) => process.env.NODE_ENV === 'test',
});

/**
 * Auth routes rate limiter — 10 requests per 15 minutes per IP.
 * Applied to /login and /register.
 */
const authLimiter = rateLimit({
  windowMs,
  max,
  store),
  message: {
    success,
    message, please try again later',
    error: { code,
  },
  standardHeaders,
  legacyHeaders,
  skip) => process.env.NODE_ENV === 'test',
});

/**
 * OTP rate limiter — 5 requests per 15 minutes, keyed by identifier (email/phone)
 * rather than IP so a shared network can't lock out multiple users.
 * Falls back to IP if no identifier is present (e.g. missing body on bad requests).
 */
const otpLimiter = rateLimit({
  windowMs,
  max,
  store),
  message: {
    success,
    message, please try again later',
    error: { code,
  },
  standardHeaders,
  legacyHeaders,
  keyGenerator) => {
    const identifier =
      (req.body, string> | undefined)?.identifier?.trim();
    return identifier || req.ip || 'unknown';
  },
  skip) => process.env.NODE_ENV === 'test',
});

/**
 * Per-user rate limiter for authenticated routes (Section 5.2)
 * 300 requests per 15 minutes per user
 */
const userRateLimiter = rateLimit({
  windowMs,
  max,
  store),
  keyGenerator) => {
    // Use user ID from JWT if authenticated, fall back to IP
    return req.user?._id?.toString() || req.ip || 'unknown';
  },
  message: {
    success,
    message,
    error: { code,
  },
  standardHeaders,
  legacyHeaders,
  skip) => process.env.NODE_ENV === 'test',
});

/**
 * Availability check rate limiter — 50 requests per 15 minutes per IP.
 * More lenient for real-time availability checking during registration.
 */
const availabilityLimiter = rateLimit({
  windowMs,
  max,
  store),
  message: {
    success,
    message, please slow down',
    error: { code,
  },
  standardHeaders,
  legacyHeaders,
  skip) => process.env.NODE_ENV === 'test',
});
