"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTargetUser = exports.requireAnalystOrAdmin = exports.requireAdmin = exports.requireRole = void 0;
const user_model_1 = require("../modules/users/user.model");
const errorHandler_1 = require("./errorHandler");
/**
 * RBAC middleware - require specific roles
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 */
const requireRole = (...roles) => {
    return (req, _res, next) => {
        if (!req.user) {
            throw new errorHandler_1.UnauthorizedError('Authentication required');
        }
        if (!roles.includes(req.user.role)) {
            throw new errorHandler_1.ForbiddenError(`Access denied. Required roles: ${roles.join(', ')}`);
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * Only admin can proceed
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        throw new errorHandler_1.UnauthorizedError('Authentication required');
    }
    if (req.user.role !== user_model_1.UserRole.ADMIN) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Admin or analyst can proceed
 */
const requireAnalystOrAdmin = (req, res, next) => {
    if (!req.user) {
        throw new errorHandler_1.UnauthorizedError('Authentication required');
    }
    if (![user_model_1.UserRole.ADMIN, user_model_1.UserRole.ANALYST].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
};
exports.requireAnalystOrAdmin = requireAnalystOrAdmin;
/**
 * Resolves which userId to use based on role
 * - Admin: can target any user via body.userId (for create) or query.userId (for read)
 * - Analyst: can filter by query.userId (read only)
 * - User: always sees only themselves
 */
const resolveTargetUser = (req, _res, next) => {
    if (!req.user) {
        throw new errorHandler_1.UnauthorizedError('Authentication required');
    }
    // 🔒 CRITICAL FIX: Use _id (MongoDB field) not id
    const userId = req.user._id.toString();
    // Admin can target any user
    if (req.user.role === user_model_1.UserRole.ADMIN) {
        // For POST/PUT - check body.userId
        if (req.body?.userId) {
            req.targetUserId = req.body.userId;
        }
        // For GET - check query.userId
        else if (req.query?.userId) {
            req.targetUserId = req.query.userId;
        }
        // If no userId specified, admin sees all (handled in service layer)
        else {
            req.targetUserId = undefined;
        }
    }
    // 🔒 SECURITY FIX: Analyst can filter by userId (read only), but defaults to their own userId
    // Previously, ANALYST without query.userId would get undefined, leaking all users' data
    else if (req.user.role === user_model_1.UserRole.ANALYST) {
        if (req.query?.userId) {
            req.targetUserId = req.query.userId;
        }
        else {
            // Default to analyst's own userId to prevent data leakage
            req.targetUserId = userId;
        }
    }
    // Regular user always sees only themselves
    else {
        req.targetUserId = userId;
    }
    next();
};
exports.resolveTargetUser = resolveTargetUser;
