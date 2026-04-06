"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("./config/redis");
const cloudinary_1 = __importDefault(require("cloudinary"));
/**
 * Startup health verification (Section 7.3)
 * Verifies all critical services are reachable before binding the port
 * Made more resilient to handle service failures gracefully
 */
const verifyStartup = async () => {
    const healthChecks = [];
    // 1. MongoDB ping (critical - must work)
    try {
        if (mongoose_1.default.connection.db) {
            await mongoose_1.default.connection.db.admin().ping();
            logger_1.logger.info('✅ MongoDB: healthy');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ MongoDB: unhealthy', error);
        throw new Error('MongoDB connection failed - cannot start server');
    }
    // 2. Redis ping (optional - graceful degradation)
    try {
        const redis = (0, redis_1.getRedisClient)();
        if (redis) {
            await redis.ping();
            logger_1.logger.info('✅ Redis: healthy');
        }
        else {
            logger_1.logger.info('ℹ️ Redis: not configured (graceful degradation)');
        }
    }
    catch (error) {
        logger_1.logger.warn('⚠️ Redis: unhealthy, continuing without Redis', error);
    }
    // 3. Verify Cloudinary config is valid (optional - graceful degradation)
    try {
        await cloudinary_1.default.v2.api.ping();
        logger_1.logger.info('✅ Cloudinary: healthy');
    }
    catch (error) {
        logger_1.logger.warn('⚠️ Cloudinary: unhealthy, file uploads may fail', error);
    }
};
/**
 * Start the server with production optimizations
 */
const startServer = async () => {
    try {
        logger_1.logger.info('🚀 Starting Finance Dashboard Backend...');
        // Connect to database
        logger_1.logger.info('📡 Connecting to MongoDB...');
        await (0, db_1.connectDB)();
        logger_1.logger.info('✅ MongoDB connected successfully');
        // Verify all services are healthy
        logger_1.logger.info('🔍 Verifying service health...');
        await verifyStartup();
        logger_1.logger.info('✅ Service health verification complete');
        // Create Express app
        logger_1.logger.info('⚙️ Creating Express application...');
        const app = (0, app_1.createApp)();
        logger_1.logger.info('✅ Express app created successfully');
        // Start listening
        logger_1.logger.info(`🌐 Starting server on port ${env_1.env.port}...`);
        const server = app.listen(env_1.env.port, () => {
            logger_1.logger.info(`🚀 Server running on port ${env_1.env.port} in ${env_1.env.nodeEnv} mode`);
            logger_1.logger.info(`🏥 Health check: http://localhost:${env_1.env.port}/api/health`);
            if (env_1.env.nodeEnv !== 'production') {
                logger_1.logger.info(`📚 API Documentation: http://localhost:${env_1.env.port}/api/docs`);
            }
        });
        // Section 6.4: Set keepAliveTimeout and headersTimeout
        // Must be higher than the load balancer's idle timeout (AWS ALB default: 60s)
        server.keepAliveTimeout = 65000;
        server.headersTimeout = 66000; // Must be > keepAliveTimeout
        // Section 6.3: Graceful shutdown with connection draining
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
            // Stop accepting new connections
            server.close(async () => {
                logger_1.logger.info('HTTP server closed — no new connections accepted');
                try {
                    // Wait for MongoDB operations to complete
                    await mongoose_1.default.connection.close(false); // false = don't force close
                    logger_1.logger.info('MongoDB connection closed cleanly');
                }
                catch (err) {
                    logger_1.logger.error('Error closing MongoDB connection:', err);
                }
                logger_1.logger.info('Graceful shutdown complete');
                process.exit(0);
            });
            // Force shutdown if graceful close takes too long
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown after 30s timeout');
                process.exit(1);
            }, 30000); // 30s (was 10s — too short for slow queries)
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        // Log more details about the error
        if (error instanceof Error) {
            logger_1.logger.error('Error name:', error.name);
            logger_1.logger.error('Error message:', error.message);
            logger_1.logger.error('Error stack:', error.stack);
        }
        // Log environment info for debugging
        logger_1.logger.error('Environment info:', {
            nodeEnv: env_1.env.nodeEnv,
            port: env_1.env.port,
            mongodbUri: env_1.env.mongodbUri ? 'SET' : 'NOT SET',
            jwtAccessSecret: env_1.env.jwt.accessSecret ? 'SET' : 'NOT SET',
            cloudinaryCloudName: env_1.env.cloudinary.cloudName ? 'SET' : 'NOT SET',
        });
        process.exit(1);
    }
};
// Start the server
startServer();
