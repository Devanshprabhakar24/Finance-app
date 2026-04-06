"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Zod validation middleware
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
const validate = (schema) => {
    return async (req, _res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                next(error);
            }
            else {
                next(error);
            }
        }
    };
};
exports.validate = validate;
/**
 * Validate request body only
 */
const validateBody = (schema) => {
    return async (req, _res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateBody = validateBody;
/**
 * Validate request query only
 */
const validateQuery = (schema) => {
    return async (req, _res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
