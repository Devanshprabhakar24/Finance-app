import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UnauthorizedError } from './errorHandler';

/**
 * Double Submit Cookie CSRF Protection
 * Generates a CSRF token and sets it in a cookie
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  // Generate CSRF token if not exists
  if (!req.cookies.csrfToken) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies.csrfToken;
  }
  next();
};

/**
 * Verify CSRF token for state-mutating requests
 * Exempt GET, HEAD, OPTIONS
 */
export const verifyCsrfToken = (req: Request, _res: Response, next: NextFunction) => {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for refresh token endpoint (uses httpOnly cookie only)
  if (req.path === '/api/auth/refresh-token') {
    return next();
  }

  const tokenFromCookie = req.cookies.csrfToken;
  const tokenFromHeader = req.headers['x-csrf-token'] as string;

  if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
    throw new UnauthorizedError('Invalid CSRF token');
  }

  next();
};
