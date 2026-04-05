const { Request, Response, NextFunction  } = require('express');

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 * @returns Express middleware function
 */
const asyncHandler = (
  fn: (req, res, next) => Promise<any>
) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
