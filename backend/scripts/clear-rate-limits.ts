/**
 * Clear Rate Limits Script
 * 
 * This script clears all rate limit entries from Redis
 * Useful during development when you hit rate limits
 */

import { getRedisClient } from '../src/config/redis';
import { logger } from '../src/utils/logger';

async function clearRateLimits() {
  try {
    const redis = getRedisClient();
    
    if (!redis) {
      logger.error('Redis client not available. Rate limits are stored in memory and will reset on server restart.');
      logger.info('💡 Solution: Restart your backend server to clear in-memory rate limits');
      process.exit(1);
    }

    logger.info('Clearing rate limits from Redis...');
    
    // Find all rate limit keys (they start with 'rl:')
    const keys = await redis.keys('rl:*');
    
    if (keys.length === 0) {
      logger.info('No rate limit keys found in Redis');
      process.exit(0);
    }

    logger.info(`Found ${keys.length} rate limit keys`);
    
    // Delete all rate limit keys
    await redis.del(...keys);
    
    logger.info('✅ Successfully cleared all rate limits!');
    logger.info('You can now try logging in again');
    
    process.exit(0);
  } catch (error) {
    logger.error('Failed to clear rate limits:', error);
    process.exit(1);
  }
}

// Run the script
clearRateLimits();
