import { Request, Response, NextFunction } from 'express';

/**
 * Response time middleware (Section 2.6)
 * Adds X-Response-Time header for performance monitoring
 */
export const responseTime = () => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
    });
    next();
  };
};
