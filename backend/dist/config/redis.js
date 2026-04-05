const { Redis  } = require('ioredis');
const { env  } = require('./env');
const { logger  } = require('../utils/logger');

let redisClient= null;

/**
 * Get Redis client instance (Section 5.1)
 * Returns null if Redis is not configured (graceful degradation)
 */
const getRedisClient = ()=> {
  if (!env.redisUrl) return null;  // gracefully degrade if Redis not configured

  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest,
      retryStrategy) => Math.min(times * 100, 2000),
      lazyConnect,
    });

    redisClient.on('error', (err) => logger.warn('Redis error, err));
    redisClient.on('connect', () => logger.info('Redis connected'));
  }

  return redisClient;
};
