"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCsrfToken = exports.generateCsrfToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const errorHandler_1 = require("./errorHandler");
/**
 * Double Submit Cookie CSRF Protection
 * Generates a CSRF token and sets it in a cookie
 */
const generateCsrfToken = (req, res, next) => {
    // Generate CSRF token if not exists
    if (!req.cookies.csrfToken) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        res.cookie('csrfToken', token, {
            httpOnly: false, // Must be readable by JavaScript
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-origin in production
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
        req.csrfToken = token;
    }
    else {
        req.csrfToken = req.cookies.csrfToken;
    }
    next();
};
exports.generateCsrfToken = generateCsrfToken;
/**
 * Verify CSRF token for state-mutating requests
 * Exempt GET, HEAD, OPTIONS
 */
const verifyCsrfToken = (req, _res, next) => {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }
    // Skip for refresh token endpoint (uses httpOnly cookie only)
    if (req.path === '/api/auth/refresh-token') {
        return next();
    }
    // In production with cross-origin requests, be more flexible with CSRF
    if (process.env.NODE_ENV === 'production') {
        // Check if request is from allowed origin
        const origin = req.headers.origin;
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
        if (origin && allowedOrigins.includes(origin)) {
            // For trusted origins, allow requests without CSRF token for auth endpoints
            if (req.path.startsWith('/api/auth/')) {
                return next();
            }
        }
    }
    const tokenFromCookie = req.cookies.csrfToken;
    const tokenFromHeader = req.headers['x-csrf-token'];
    if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
        throw new errorHandler_1.UnauthorizedError('Invalid CSRF token');
    }
    next();
};
exports.verifyCsrfToken = verifyCsrfToken;
