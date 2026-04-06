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

/**
 * Only admin can proceed
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  
  next();
};

/**
 * Admin or analyst can proceed
 */
export const requireAnalystOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }
  
  if (![UserRole.ADMIN, UserRole.ANALYST].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  
  next();
};

/**
 * Resolves which userId to use based on role
 * - Admin: can target any user via body.userId (for create) or query.userId (for read)
 * - Analyst: can filter by query.userId (read only)
 * - User: always sees only themselves
 */
export const resolveTargetUser = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  // Admin can target any user
  if (req.user.role === UserRole.ADMIN) {
    // For POST/PUT - check body.userId
    if (req.body?.userId) {
      req.targetUserId = req.body.userId;
    } 
    // For GET - check query.userId
    else if (req.query?.userId) {
      req.targetUserId = req.query.userId as string;
    }
    // If no userId specified, admin sees all (handled in service layer)
    else {
      req.targetUserId = undefined;
    }
  } 
  // Analyst can filter by userId (read only)
  else if (req.user.role === UserRole.ANALYST && req.query?.userId) {
    req.targetUserId = req.query.userId as string;
  } 
  // Regular user always sees only themselves
  else {
    req.targetUserId = req.user.id;
  }

  next();
};
