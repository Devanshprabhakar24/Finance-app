"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
/**
 * Send success response
 */
const sendSuccess = (res, message, data, meta, statusCode = 200) => {
    const response = {
        success: true,
        message,
        data: data || undefined,
        meta: meta || undefined,
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Send error response
 */
const sendError = (res, message, code, details, statusCode = 500) => {
    const response = {
        success: false,
        message,
        error: {
            code,
            details: details || undefined,
        },
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
