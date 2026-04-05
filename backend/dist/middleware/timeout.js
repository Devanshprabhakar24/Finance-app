const { Request, Response, NextFunction  } = require('express');

/**
 * Request timeout middleware (Section 2.5)
 * Sends 503 if a handler takes longer than `ms` milliseconds.
 * @param ms - Timeout in milliseconds
 */
const requestTimeout = (ms) => {
  return (_req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          success,
          message,
          error: { code,
        });
      }
    }, ms);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};
