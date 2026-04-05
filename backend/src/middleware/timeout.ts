import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware (Section 2.5)
 * Sends 503 if a handler takes longer than `ms` milliseconds.
 * @param ms - Timeout in milliseconds
 */
export const requestTimeout = (ms: number) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: 'Request timeout. Please try again.',
          error: { code: 'REQUEST_TIMEOUT' },
        });
      }
    }, ms);

    // Clear timeout when response finishes
    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};
