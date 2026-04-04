import { Redis } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

/**
 * Get Redis client instance (Section 5.1)
 * Returns null if Redis is not configured (graceful degradation)
 */
export const getRedisClient = (): Redis | null => {
  if (!env.redisUrl) return null;  // gracefully degrade if Redis not configured

  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 2000),
      lazyConnect: true,
    });

    redisClient.on('error', (err) => logger.warn('Redis error:', err));
    redisClient.on('connect', () => logger.info('Redis connected'));
  }

  return redisClient;
};
