const { Request, Response, NextFunction  } = require('express');
const jwt = require('jsonwebtoken');
const { Types  } = require('mongoose');
const { env  } = require('../config/env');
const { UnauthorizedError  } = require('./errorHandler');
const { asyncHandler  } = require('../utils/asyncHandler');
const { getCachedUser  } = require('../utils/userCache');
const { UserRole  } = require('../modules/users/user.model');

/**
 * JWT authentication middleware (Section 3.1)
 * Verifies JWT token and attaches user to request
 */
const authenticate = asyncHandler(
  async (req, _res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, env.jwt.accessSecret);

      // Find user using cache (Section 3.1)
      const user = await getCachedUser(decoded.userId);

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      // Check if user is active
      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedError('Account is inactive');
      }

      // Attach user to request
      req.user = user; // Type assertion needed due to cache return type
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }
);

/**
 * Lightweight JWT authentication middleware
 * Verifies JWT token without DB lookup - uses only JWT claims
 * Use for read-only endpoints where fresh user data is not critical
 */
const lightAuthenticate = asyncHandler(
  async (req, _res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, env.jwt.accessSecret);

      // Create a minimal user object from JWT claims (no DB lookup)
      req.user = {
        _id),
        email,
        role,
      } as any; // Type assertion for minimal user object

      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }
);
