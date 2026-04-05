const { Request, Response, NextFunction  } = require('express');
const { UserRole  } = require('../modules/users/user.model');
const { ForbiddenError, UnauthorizedError  } = require('./errorHandler');

/**
 * RBAC middleware - require specific roles
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 */
const requireRole = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${roles.join(', ')}`
      );
    }

    next();
  };
};
