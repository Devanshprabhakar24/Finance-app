import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../modules/users/user.model';
import { ForbiddenError, UnauthorizedError } from './errorHandler';

/**
 * RBAC middleware - require specific roles
 * @param roles - Array of allowed roles
 * @returns Express middleware function
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
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
