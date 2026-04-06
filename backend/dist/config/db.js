"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
/**
 * Connect to MongoDB database with optimized settings
 * @returns Promise<void>
 */
const connectDB = async () => {
    try {
        // Production-optimized connection options (Section 1.4)
        const conn = await mongoose_1.default.connect(env_1.env.mongodbUri, {
            maxPoolSize: env_1.env.nodeEnv === 'production' ? 50 : 10,
            minPoolSize: env_1.env.nodeEnv === 'production' ? 10 : 2,
            maxIdleTimeMS: 30000, // Close idle connections after 30s
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
            heartbeatFrequencyMS: 10000, // Check replica set health every 10s
            retryWrites: true,
            retryReads: true,
            compressors: ['zlib'], // Compress wire protocol messages
            family: 4, // Use IPv4, skip trying IPv6
        });
        logger_1.logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
        // Enable query logging in development
        if (env_1.env.nodeEnv === 'development') {
            mongoose_1.default.set('debug', true);
        }
        // Synchronize indexes on connection (Section 1.1)
        mongoose_1.default.connection.on('open', async () => {
            try {
                await mongoose_1.default.connection.syncIndexes();
                logger_1.logger.info('MongoDB indexes synchronized');
            }
            catch (err) {
                logger_1.logger.error('Error synchronizing indexes:', err);
            }
        });
        // Handle connection events
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error('MongoDB connection error:', err);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            logger_1.logger.info('MongoDB reconnected');
        });
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            logger_1.logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await mongoose_1.default.connection.close();
            logger_1.logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
/**
 * Disconnect from MongoDB database
 * @returns Promise<void>
 */
const disconnectDB = async () => {
    try {
        await mongoose_1.default.connection.close();
        logger_1.logger.info('MongoDB disconnected');
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
};
exports.disconnectDB = disconnectDB;
