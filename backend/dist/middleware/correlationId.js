"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.correlationId = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Correlation ID middleware (Section 4.2)
 * Adds a unique correlation ID to each request for tracing
 */
const correlationId = () => {
    return (req, res, next) => {
        req.correlationId = req.headers['x-correlation-id'] ||
            req.headers['x-request-id'] ||
            crypto_1.default.randomUUID();
        res.setHeader('X-Correlation-ID', req.correlationId);
        next();
    };
};
exports.correlationId = correlationId;
