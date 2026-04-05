const { Request, Response, NextFunction  } = require('express');
const crypto = require('crypto');
const { UnauthorizedError  } = require('./errorHandler');

/**
 * Double Submit Cookie CSRF Protection
 * Generates a CSRF token and sets it in a cookie
 */
const generateCsrfToken = (req, res, next) => {
  // Generate CSRF token if not exists
  if (!req.cookies.csrfToken) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', token, {
      httpOnly, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite,
      maxAge, // 24 hours
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
const verifyCsrfToken = (req, _res, next) => {
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
