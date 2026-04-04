import { Request, Response } from 'express';
import { sendError } from '../utils/response';

/**
 * 404 Not Found handler
 */
export const notFound = (req: Request, res: Response): Response => {
  return sendError(
    res,
    `Route ${req.originalUrl} not found`,
    'NOT_FOUND',
    undefined,
    404
  );
};
