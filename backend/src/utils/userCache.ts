import { LRUCache } from 'lru-cache';
import { User, IUser } from '../modules/users/user.model';

// Section 3.1: Cache up to 500 users, TTL 60 seconds
const cache = new LRUCache<string, Omit<IUser, 'passwordHash' | 'refreshToken'>>({
  max: 500,
  ttl: 60 * 1000,
});

/**
 * Get user by ID, using in-memory cache.
 * Use for authentication reads only — never for writes.
 */
export const getCachedUser = async (userId: string) => {
  const cached = cache.get(userId);
  if (cached) return cached;

  const user = await User.findById(userId)
    .select('name email phone role status isVerified lastLogin')
    .lean();

  if (user) cache.set(userId, user as any);
  return user;
};

/**
 * Invalidate user cache entry.
 * Call after: role change, status change, profile update, logout.
 */
export const invalidateUserCache = (userId: string) => {
  cache.delete(userId);
};
