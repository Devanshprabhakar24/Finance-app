import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

/**
 * Correlation ID middleware (Section 4.2)
 * Adds a unique correlation ID to each request for tracing
 */
export const correlationId = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.correlationId = (req.headers['x-correlation-id'] as string) ||
                        (req.headers['x-request-id'] as string) ||
                        crypto.randomUUID();
    res.setHeader('X-Correlation-ID', req.correlationId);
    next();
  };
};
