"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseTime = void 0;
/**
 * Response time middleware (Section 2.6)
 * Adds X-Response-Time header for performance monitoring
 */
const responseTime = () => {
    return (_req, res, next) => {
        const start = process.hrtime();
        res.on('finish', () => {
            // Only set header if response hasn't been sent yet
            if (!res.headersSent) {
                const [seconds, nanoseconds] = process.hrtime(start);
                const durationMs = seconds * 1000 + nanoseconds / 1000000;
                res.setHeader('X-Response-Time', `${durationMs.toFixed(2)}ms`);
            }
        });
        next();
    };
};
exports.responseTime = responseTime;
