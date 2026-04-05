const { Request, Response, NextFunction  } = require('express');
const { AnyZodObject, ZodError  } = require('zod');

/**
 * Zod validation middleware
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
const validate = (schema) => {
  return async (req, _res, next) => {
    try {
      await schema.parseAsync({
        body,
        query,
        params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(error);
      } else {
        next(error);
      }
    }
  };
};

/**
 * Validate request body only
 */
const validateBody = (schema) => {
  return async (req, _res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate request query only
 */
const validateQuery = (schema) => {
  return async (req, _res, next) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      next(error);
    }
  };
};
