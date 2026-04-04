import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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
