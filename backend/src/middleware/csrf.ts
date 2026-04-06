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
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-origin in production
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

  // In production, validate origin against allowed list before checking CSRF token
  if (process.env.NODE_ENV === 'production') {
    const origin = req.headers.origin;
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());

    // Check exact match or wildcard *.vercel.app subdomains for preview deployments
    const isAllowedOrigin = origin && (
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9-]+-projects\.vercel\.app$/.test(origin) ||
      allowedOrigins.some(o => o.startsWith('*.') && origin.endsWith(o.slice(1)))
    );

    if (isAllowedOrigin) {
      // For trusted origins, skip CSRF for auth endpoints
      if (req.path.startsWith('/api/auth/')) {
        return next();
      }
    }
  }

  const tokenFromCookie = req.cookies.csrfToken;
  const tokenFromHeader = req.headers['x-csrf-token'] as string;

  if (!tokenFromCookie || !tokenFromHeader || tokenFromCookie !== tokenFromHeader) {
    throw new UnauthorizedError('Invalid CSRF token');
  }

  next();
};
