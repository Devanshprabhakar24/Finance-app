const { LRUCache  } = require('lru-cache');
const { User, IUser  } = require('../modules/users/user.model');

// Section 3.1, TTL 60 seconds
const cache = new LRUCache<string, Omit<IUser, 'passwordHash' | 'refreshToken'>>({
  max,
  ttl,
});

/**
 * Get user by ID, using in-memory cache.
 * Use for authentication reads only — never for writes.
 */
const getCachedUser = async (userId) => {
  const cached = cache.get(userId);
  if (cached) return cached;

  const user = await User.findById(userId)
    .select('name email phone role status isVerified lastLogin')
    .lean();

  if (user) cache.set(userId, user);
  return user;
};

/**
 * Invalidate user cache entry.
 * Call after, status change, profile update, logout.
 */
const invalidateUserCache = (userId) => {
  cache.delete(userId);
};
