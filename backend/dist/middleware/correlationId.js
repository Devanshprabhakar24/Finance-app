const { Request, Response, NextFunction  } = require('express');
const crypto = require('crypto');

declare global {
  namespace Express {
    
  }
}

/**
 * Correlation ID middleware (Section 4.2)
 * Adds a unique correlation ID to each request for tracing
 */
const correlationId = () => {
  return (req, res, next) => {
    req.correlationId = (req.headers['x-correlation-id'] as string) ||
                        (req.headers['x-request-id'] as string) ||
                        crypto.randomUUID();
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
  };
};
