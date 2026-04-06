import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import mongoose from 'mongoose';
import { getRedisClient } from './config/redis';
import cloudinary from 'cloudinary';

/**
 * Startup health verification (Section 7.3)
 * Verifies all critical services are reachable before binding the port
 * Made more resilient to handle service failures gracefully
 */
const verifyStartup = async () => {
  const healthChecks = [];

  // 1. MongoDB ping (critical - must work)
  try {
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      logger.info('✅ MongoDB: healthy');
    }
  } catch (error) {
    logger.error('❌ MongoDB: unhealthy', error);
    throw new Error('MongoDB connection failed - cannot start server');
  }

  // 2. Redis ping (optional - graceful degradation)
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      logger.info('✅ Redis: healthy');
    } else {
      logger.info('ℹ️ Redis: not configured (graceful degradation)');
    }
  } catch (error) {
    logger.warn('⚠️ Redis: unhealthy, continuing without Redis', error);
  }

  // 3. Verify Cloudinary config is valid (optional - graceful degradation)
  try {
    await cloudinary.v2.api.ping();
    logger.info('✅ Cloudinary: healthy');
  } catch (error) {
    logger.warn('⚠️ Cloudinary: unhealthy, file uploads may fail', error);
  }
};

/**
 * Start the server with production optimizations
 */
const startServer = async () => {
  try {
    logger.info('🚀 Starting Finance Dashboard Backend...');
    
    // Connect to database
    logger.info('📡 Connecting to MongoDB...');
    await connectDB();
    logger.info('✅ MongoDB connected successfully');

    // Verify all services are healthy
    logger.info('🔍 Verifying service health...');
    await verifyStartup();
    logger.info('✅ Service health verification complete');

    // Create Express app
    logger.info('⚙️ Creating Express application...');
    const app = createApp();
    logger.info('✅ Express app created successfully');

    // Start listening
    logger.info(`🌐 Starting server on port ${env.port}...`);
    const server = app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
      logger.info(`🏥 Health check: http://localhost:${env.port}/api/health`);
      if (env.nodeEnv !== 'production') {
        logger.info(`📚 API Documentation: http://localhost:${env.port}/api/docs`);
      }
    });

    // Section 6.4: Set keepAliveTimeout and headersTimeout
    // Must be higher than the load balancer's idle timeout (AWS ALB default: 60s)
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;  // Must be > keepAliveTimeout

    // Section 6.3: Graceful shutdown with connection draining
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      // Stop accepting new connections
      server.close(async () => {
        logger.info('HTTP server closed — no new connections accepted');
        
        try {
          // Wait for MongoDB operations to complete
          await mongoose.connection.close(false);  // false = don't force close
          logger.info('MongoDB connection closed cleanly');
        } catch (err) {
          logger.error('Error closing MongoDB connection:', err);
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
    logger.error('❌ Failed to start server:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      logger.error('Error name:', error.name);
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
    }
    
    // Log environment info for debugging
    logger.error('Environment info:', {
      nodeEnv: env.nodeEnv,
      port: env.port,
      mongodbUri: env.mongodbUri ? 'SET' : 'NOT SET',
      jwtAccessSecret: env.jwt.accessSecret ? 'SET' : 'NOT SET',
      cloudinaryCloudName: env.cloudinary.cloudName ? 'SET' : 'NOT SET',
    });
    
    process.exit(1);
  }
};

// Start the server
startServer();
