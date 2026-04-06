"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.availabilityLimiter = exports.userRateLimiter = exports.otpLimiter = exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = require("rate-limit-redis");
const redis_1 = require("../config/redis");
/**
 * Get Redis store for rate limiting (Section 5.1)
 * Falls back to in-memory if Redis not available
 */
const getStore = () => {
    const redis = (0, redis_1.getRedisClient)();
    if (!redis)
        return undefined; // falls back to in-memory if Redis not available
    return new rate_limit_redis_1.RedisStore({
        // @ts-ignore - Redis call signature compatibility
        sendCommand: (...args) => redis.call(...args),
        prefix: 'rl:',
    });
};
/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 * Section 5.1: Uses Redis-backed store for multi-instance deployments
 */
exports.globalLimiter = (0, express_rate_limit_1.default)({
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
exports.authLimiter = (0, express_rate_limit_1.default)({
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
exports.otpLimiter = (0, express_rate_limit_1.default)({
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
        const identifier = req.body?.identifier?.trim();
        return identifier || req.ip || 'unknown';
    },
    skip: () => process.env.NODE_ENV === 'test',
});
/**
 * Per-user rate limiter for authenticated routes (Section 5.2)
 * 300 requests per 15 minutes per user
 */
exports.userRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    store: getStore(),
    keyGenerator: (req) => {
        // Use user ID from JWT if authenticated, fall back to IP
        return req.user?._id?.toString() || req.ip || 'unknown';
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
exports.availabilityLimiter = (0, express_rate_limit_1.default)({
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
