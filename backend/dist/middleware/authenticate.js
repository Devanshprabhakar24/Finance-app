"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lightAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = require("mongoose");
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
const asyncHandler_1 = require("../utils/asyncHandler");
const userCache_1 = require("../utils/userCache");
/**
 * JWT authentication middleware (Section 3.1: uses user cache)
 * Verifies JWT token and attaches user to request
 */
exports.authenticate = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errorHandler_1.UnauthorizedError('No token provided');
    }
    const token = authHeader.split(' ')[1];
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
        // Find user using cache (Section 3.1)
        const user = await (0, userCache_1.getCachedUser)(decoded.userId);
        if (!user) {
            throw new errorHandler_1.UnauthorizedError('User not found');
        }
        // Check if user is active
        if (user.status !== 'ACTIVE') {
            throw new errorHandler_1.UnauthorizedError('Account is inactive');
        }
        // Attach user to request
        req.user = user; // Type assertion needed due to cache return type
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.UnauthorizedError('Invalid token');
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errorHandler_1.UnauthorizedError('Token expired');
        }
        throw error;
    }
});
/**
 * Lightweight JWT authentication middleware
 * Verifies JWT token without DB lookup - uses only JWT claims
 * Use for read-only endpoints where fresh user data is not critical
 */
exports.lightAuthenticate = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new errorHandler_1.UnauthorizedError('No token provided');
    }
    const token = authHeader.split(' ')[1];
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
        // Create a minimal user object from JWT claims (no DB lookup)
        req.user = {
            _id: new mongoose_1.Types.ObjectId(decoded.userId),
            email: decoded.email,
            role: decoded.role,
        }; // Type assertion for minimal user object
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw new errorHandler_1.UnauthorizedError('Invalid token');
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errorHandler_1.UnauthorizedError('Token expired');
        }
        throw error;
    }
});
