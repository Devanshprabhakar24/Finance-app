const { Request, Response, NextFunction  } = require('express');
const { ZodError  } = require('zod');
const { Error;
import { JsonWebTokenError, TokenExpiredError  } = require('jsonwebtoken');
const { logger  } = require('../utils/logger');
const { sendError  } = require('../utils/response');
const { env  } = require('../config/env');

/**
 * Base AppError class
 */
class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message, statusCode, code) {
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
class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class TooManyAttemptsError extends AppError {
  retryAfter: number;

  constructor(message: string = 'Too many attempts', retryAfter: number) {
    super(message, 429, 'TOO_MANY_ATTEMPTS');
    this.retryAfter = retryAfter;
  }
}

class InternalError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

/**
 * Global error handler middleware (Section 4.2)
 */
const errorHandler = (
  err,
  req,
  res,
  _next: NextFunction
)=> {
  logger.error('Error, {
    correlationId,
    message,
    stack,
    path,
    method,
    userId,
  });

  // Handle Multer errors (Section 2.7, wrong type)
  if (err.name === 'MulterError') {
    const multerError = err;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
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
      field),
      message,
    }));
    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', details, 422);
  }

  // Handle Mongoose validation errors
  if (err instanceof MongooseError.ValidationError) {
    const details = Object.values(err.errors).map((error) => ({
      field,
      message,
    }));
    return sendError(res, 'Validation failed', 'VALIDATION_ERROR', details, 400);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof MongooseError.CastError) {
    return sendError(res, `Invalid ${err.path}: ${err.value}`, 'INVALID_ID', undefined, 400);
  }

  // Handle MongoDB duplicate key error
  if (err.name === 'MongoServerError' && 'code' in err && (err).code === 11000) {
    const mongoError = err;
    const field = Object.keys(mongoError.keyPattern)[0];
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
