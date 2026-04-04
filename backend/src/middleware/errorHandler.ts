import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { env } from '../config/env';

/**
 * Base AppError class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error classes
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class TooManyAttemptsError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Too many attempts', retryAfter?: number) {
    super(message, 429, 'TOO_MANY_ATTEMPTS');
    this.retryAfter = retryAfter;
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * Global error handler middleware (Section 4.2: includes correlation ID)
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  logger.error('Error:', {
    correlationId: (req as any).correlationId,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?._id,
  });

  // Handle Multer errors (Section 2.7: file too large, wrong type)
  if ((err as any).name === 'MulterError') {
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File too large. Maximum size is 5MB.', 'FILE_TOO_LARGE', undefined, 413);
    }
    return sendError(res, err.message, 'UPLOAD_ERROR', undefined, 400);
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    // Add Retry-After header for rate limit errors
    if (err instanceof TooManyAttemptsError && err.retryAfter) {
      res.setHeader('Retry-After', err.retryAfter.toString());
    }
    return sendError(res, err.message, err.code, undefined, err.statusCode);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));
    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', details, 422);
  }

  // Handle Mongoose validation errors
  if (err instanceof MongooseError.ValidationError) {
    const details = Object.values(err.errors).map((error: any) => ({
      field: error.path,
      message: error.message,
    }));
    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', details, 400);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof MongooseError.CastError) {
    return sendError(res, `Invalid ${err.path}: ${err.value}`, 'INVALID_ID', undefined, 400);
  }

  // Handle MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    return sendError(
      res,
      `${field} already exists`,
      'DUPLICATE_KEY',
      { field },
      409
    );
  }

  // Handle JWT errors
  if (err instanceof JsonWebTokenError) {
    return sendError(res, 'Invalid token', 'INVALID_TOKEN', undefined, 401);
  }

  if (err instanceof TokenExpiredError) {
    return sendError(res, 'Token expired', 'TOKEN_EXPIRED', undefined, 401);
  }

  // Default internal server error
  const message = env.nodeEnv === 'production' ? 'Internal server error' : err.message;
  const details = env.nodeEnv === 'production' ? undefined : { stack: err.stack };

  return sendError(res, message, 'INTERNAL_ERROR', details, 500);
};
