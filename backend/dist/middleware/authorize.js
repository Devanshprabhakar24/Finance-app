"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
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
