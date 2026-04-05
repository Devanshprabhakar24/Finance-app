import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';

/**
 * Get Redis store for rate limiting (Section 5.1)
 * Falls back to in-memory if Redis not available
 */
const getStore = () => {
  const redis = getRedisClient();
  if (!redis) return undefined;  // falls back to in-memory if Redis not available

  return new RedisStore({
    // @ts-ignore - Redis call signature compatibility
    sendCommand: (...args: any[]) => redis.call(...args),
    prefix: 'rl:',
  });
};

/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 * Section 5.1: Uses Redis-backed store for multi-instance deployments
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: getStore(),
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    error: { code: 'RATE_LIMIT_EXCEEDED' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Auth routes rate limiter — 10 requests per 15 minutes per IP.
 * Applied to /login and /register.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: getStore(),
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    error: { code: 'AUTH_RATE_LIMIT_EXCEEDED' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * OTP rate limiter — 5 requests per 15 minutes, keyed by identifier (email/phone)
 * rather than IP so a shared network can't lock out multiple users.
 * Falls back to IP if no identifier is present (e.g. missing body on bad requests).
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: getStore(),
  message: {
    success: false,
    message: 'Too many OTP requests, please try again later',
    error: { code: 'OTP_RATE_LIMIT_EXCEEDED' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const identifier =
      (req.body as Record<string, string> | undefined)?.identifier?.trim();
    return identifier || req.ip || 'unknown';
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Per-user rate limiter for authenticated routes (Section 5.2)
 * 300 requests per 15 minutes per user
 */
export const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  store: getStore(),
  keyGenerator: (req) => {
    // Use user ID from JWT if authenticated, fall back to IP
    return (req as any).user?._id?.toString() || req.ip || 'unknown';
  },
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: { code: 'RATE_LIMIT_EXCEEDED' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Availability check rate limiter — 50 requests per 15 minutes per IP.
 * More lenient for real-time availability checking during registration.
 */
export const availabilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  store: getStore(),
  message: {
    success: false,
    message: 'Too many availability checks, please slow down',
    error: { code: 'AVAILABILITY_RATE_LIMIT_EXCEEDED' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});
