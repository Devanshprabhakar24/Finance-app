"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const response_1 = require("../utils/response");
/**
 * 404 Not Found handler
 */
const notFound = (req, res) => {
    return (0, response_1.sendError)(res, `Route ${req.originalUrl} not found`, 'NOT_FOUND', undefined, 404);
};
exports.notFound = notFound;
