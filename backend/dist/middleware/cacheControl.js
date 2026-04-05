const { Request, Response, NextFunction  } = require('express');

/**
 * Set Cache-Control headers for read-only endpoints.
 * Section 2.1: Enable response caching for dashboard endpoints
 * @param maxAge - Browser cache seconds
 * @param sMaxAge - CDN cache seconds (longer than browser)
 */
const cacheControl = (maxAge, sMaxAge: number) => {
  return (_req, res, next) => {
    res.set(
      'Cache-Control',
      `public, max-age=${maxAge}, s-maxage=${sMaxAge ?? maxAge * 2}, stale-while-revalidate=60`
    );
    next();
  };
};

/**
 * No caching — for auth and mutation endpoints
 */
const noCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};
