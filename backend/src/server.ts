import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import mongoose from 'mongoose';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
      logger.info(`📚 API Documentation: http://localhost:${env.port}/api/docs`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close MongoDB connection
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed');
        } catch (error) {
          logger.error('Error closing MongoDB connection:', error);
        }
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
