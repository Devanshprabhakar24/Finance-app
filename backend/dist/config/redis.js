"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("./env");
const logger_1 = require("../utils/logger");
let redisClient = null;
/**
 * Get Redis client instance (Section 5.1)
 * Returns null if Redis is not configured (graceful degradation)
 */
const getRedisClient = () => {
    if (!env_1.env.redisUrl)
        return null; // gracefully degrade if Redis not configured
    if (!redisClient) {
        redisClient = new ioredis_1.Redis(env_1.env.redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 100, 2000),
            lazyConnect: true,
        });
        redisClient.on('error', (err) => logger_1.logger.warn('Redis error:', err));
        redisClient.on('connect', () => logger_1.logger.info('Redis connected'));
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
