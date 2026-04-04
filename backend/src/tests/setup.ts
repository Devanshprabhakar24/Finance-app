import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

let mongoServer: MongoMemoryServer;

/**
 * Connect to in-memory MongoDB before all tests
 */
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    logger.info('Connected to in-memory MongoDB for testing');
  } catch (error) {
    logger.error('Failed to connect to test database:', error);
    throw error;
  }
});

/**
 * Clear all collections after each test
 */
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

/**
 * Disconnect and stop MongoDB after all tests
 */
afterAll(async () => {
  try {
    await mongoose.disconnect();
    await mongoServer.stop();
    logger.info('Disconnected from test database');
  } catch (error) {
    logger.error('Failed to disconnect from test database:', error);
    throw error;
  }
});
