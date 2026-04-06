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
 */
const verifyStartup = async () => {
    // 1. MongoDB ping
    if (mongoose_1.default.connection.db) {
        await mongoose_1.default.connection.db.admin().ping();
        logger_1.logger.info('✅ MongoDB: healthy');
    }
    // 2. Redis ping (if configured)
    const redis = (0, redis_1.getRedisClient)();
    if (redis) {
        await redis.ping();
        logger_1.logger.info('✅ Redis: healthy');
    }
    // 3. Verify Cloudinary config is valid
    await cloudinary_1.default.v2.api.ping();
    logger_1.logger.info('✅ Cloudinary: healthy');
};
/**
 * Start the server with production optimizations
 */
const startServer = async () => {
    try {
        // Connect to database
        await (0, db_1.connectDB)();
        // Verify all services are healthy
        await verifyStartup();
        // Create Express app
        const app = (0, app_1.createApp)();
        // Start listening
        const server = app.listen(env_1.env.port, () => {
            logger_1.logger.info(`🚀 Server running on port ${env_1.env.port} in ${env_1.env.nodeEnv} mode`);
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
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
