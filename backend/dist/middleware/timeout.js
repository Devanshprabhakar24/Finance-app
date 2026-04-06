"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimeout = void 0;
/**
 * Request timeout middleware (Section 2.5)
 * Sends 503 if a handler takes longer than `ms` milliseconds.
 * @param ms - Timeout in milliseconds
 */
const requestTimeout = (ms) => {
    return (_req, res, next) => {
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
exports.requestTimeout = requestTimeout;
