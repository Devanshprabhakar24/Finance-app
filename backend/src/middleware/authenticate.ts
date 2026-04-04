import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../modules/users/user.model';
import { env } from '../config/env';
import { UnauthorizedError } from './errorHandler';
import { asyncHandler } from '../utils/asyncHandler';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * JWT authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;

      // Find user
      const user = await User.findById(decoded.userId).select('-passwordHash');

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is inactive');
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }
);

/**
 * Lightweight JWT authentication middleware
 * Verifies JWT token without DB lookup - uses only JWT claims
 * Use for read-only endpoints where fresh user data is not critical
 */
export const lightAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, env.jwt.accessSecret) as JwtPayload;

      // Create a minimal user object from JWT claims (no DB lookup)
      req.user = {
        _id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      } as any;

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }
);
