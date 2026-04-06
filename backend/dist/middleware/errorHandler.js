"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.InternalError = exports.TooManyAttemptsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.ValidationError = exports.AppError = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
const jsonwebtoken_1 = require("jsonwebtoken");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
const env_1 = require("../config/env");
/**
 * Base AppError class
 */
class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Specific error classes
 */
class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized access') {
        super(message, 401, 'UNAUTHORIZED');
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}
exports.ConflictError = ConflictError;
class TooManyAttemptsError extends AppError {
    constructor(message = 'Too many attempts', retryAfter) {
        super(message, 429, 'TOO_MANY_ATTEMPTS');
        this.retryAfter = retryAfter;
    }
}
exports.TooManyAttemptsError = TooManyAttemptsError;
class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, 'INTERNAL_ERROR');
    }
}
exports.InternalError = InternalError;
/**
 * Global error handler middleware (Section 4.2: includes correlation ID)
 */
const errorHandler = (err, req, res, _next) => {
    logger_1.logger.error('Error:', {
        correlationId: req.correlationId,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?._id,
    });
    // Handle Multer errors (Section 2.7: file too large, wrong type)
    if (err.name === 'MulterError') {
        const multerError = err;
        if (multerError.code === 'LIMIT_FILE_SIZE') {
            return (0, response_1.sendError)(res, 'File too large. Maximum size is 5MB.', 'FILE_TOO_LARGE', undefined, 413);
        }
        return (0, response_1.sendError)(res, err.message, 'UPLOAD_ERROR', undefined, 400);
    }
    // Handle AppError instances
    if (err instanceof AppError) {
        // Add Retry-After header for rate limit errors
        if (err instanceof TooManyAttemptsError && err.retryAfter) {
            res.setHeader('Retry-After', err.retryAfter.toString());
        }
        return (0, response_1.sendError)(res, err.message, err.code, undefined, err.statusCode);
    }
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const details = err.errors.map((error) => ({
            field: error.path.join('.'),
            message: error.message,
        }));
        return (0, response_1.sendError)(res, 'Validation failed', 'VALIDATION_ERROR', details, 422);
    }
    // Handle Mongoose validation errors
    if (err instanceof mongoose_1.Error.ValidationError) {
        const details = Object.values(err.errors).map((error) => ({
            field: error.path,
            message: error.message,
        }));
        return (0, response_1.sendError)(res, 'Validation failed', 'VALIDATION_ERROR', details, 400);
    }
    // Handle Mongoose CastError (invalid ObjectId)
    if (err instanceof mongoose_1.Error.CastError) {
        return (0, response_1.sendError)(res, `Invalid ${err.path}: ${err.value}`, 'INVALID_ID', undefined, 400);
    }
    // Handle MongoDB duplicate key error
    if (err.name === 'MongoServerError' && 'code' in err && err.code === 11000) {
        const mongoError = err;
        const field = Object.keys(mongoError.keyPattern)[0];
        return (0, response_1.sendError)(res, `${field} already exists`, 'DUPLICATE_KEY', { field }, 409);
    }
    // Handle JWT errors
    if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
        return (0, response_1.sendError)(res, 'Invalid token', 'INVALID_TOKEN', undefined, 401);
    }
    if (err instanceof jsonwebtoken_1.TokenExpiredError) {
        return (0, response_1.sendError)(res, 'Token expired', 'TOKEN_EXPIRED', undefined, 401);
    }
    // Default internal server error
    const message = env_1.env.nodeEnv === 'production' ? 'Internal server error' : err.message;
    const details = env_1.env.nodeEnv === 'production' ? undefined : { stack: err.stack };
    return (0, response_1.sendError)(res, message, 'INTERNAL_ERROR', details, 500);
};
exports.errorHandler = errorHandler;
