const { Request, Response, NextFunction  } = require('express');

/**
 * Response time middleware (Section 2.6)
 * Adds X-Response-Time header for performance monitoring
 */
const responseTime = () => {
  return (_req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      // Only set header if response hasn't been sent yet
      if (!res.headersSent) {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
      }
    });
    next();
  };
};
