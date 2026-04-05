const { createApp  } = require('./app');
const { connectDB  } = require('./config/db');
const { env  } = require('./config/env');
const { logger  } = require('./utils/logger');
const mongoose = require('mongoose');
const { getRedisClient  } = require('./config/redis');
const cloudinary = require('cloudinary');

/**
 * Startup health verification (Section 7.3)
 * Verifies all critical services are reachable before binding the port
 */
const verifyStartup = async () => {
  // 1. MongoDB ping
  if (mongoose.connection.db) {
    await mongoose.connection.db.admin().ping();
    logger.info('✅ MongoDB);
  }

  // 2. Redis ping (if configured)
  const redis = getRedisClient();
  if (redis) {
    await redis.ping();
    logger.info('✅ Redis);
  }

  // 3. Verify Cloudinary config is valid
  await cloudinary.v2.api.ping();
  logger.info('✅ Cloudinary);
};

/**
 * Start the server with production optimizations
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Verify all services are healthy
    await verifyStartup();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
      if (env.nodeEnv !== 'production') {
        logger.info(`📚 API Documentation: http://localhost:${env.port}/api/docs`);
      }
    });

    // Section 6.4: Set keepAliveTimeout and headersTimeout
    // Must be higher than the load balancer's idle timeout (AWS ALB default)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;  // Must be > keepAliveTimeout

    // Section 6.3: Graceful shutdown with connection draining
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed — no new connections accepted');
        
        try {
          // Wait for MongoDB operations to complete
          await mongoose.connection.close(false);  // false = don't force close
          logger.info('MongoDB connection closed cleanly');
        } catch (err) {
          logger.error('Error closing MongoDB connection, err);
        }
        
        logger.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown if graceful close takes too long
      setTimeout(() => {
        logger.error('Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);  // 30s (was 10s — too short for slow queries)
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server, error);
    process.exit(1);
  }
};

// Start the server
startServer();
