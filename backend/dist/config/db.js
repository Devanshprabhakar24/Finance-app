const mongoose = require('mongoose');
const { env } = require('./env');
const { logger } = require('../utils/logger');

/**
 * Connect to MongoDB database with optimized settings
 * @returns Promise<void>
 */
const connectDB = async () => {
  try {
    // Production-optimized connection options (Section 1.4)
    const conn = await mongoose.connect(env.mongodbUri, {
      maxPoolSize: env.nodeEnv === 'production' ? 50 : 10,
      minPoolSize: env.nodeEnv === 'production' ? 10 : 5,
      maxIdleTimeMS: 30000, // Close idle connections after 30s
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000, // Check replica set health every 10s
      retryWrites: true,
      retryReads: true,
      compressors: ['zlib'], // Compress wire protocol messages
      family: 4, // Use IPv4, skip trying IPv6
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Enable query logging in development
    if (env.nodeEnv === 'development') {
      mongoose.set('debug', true);
    }

    // Synchronize indexes on connection (Section 1.1)
    mongoose.connection.on('open', async () => {
      try {
        await mongoose.connection.syncIndexes();
        logger.info('MongoDB indexes synchronized');
      } catch (err) {
        logger.error('Error synchronizing indexes:', err);
      }
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 * @returns Promise<void>
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

module.exports = { connectDB, disconnectDB };
