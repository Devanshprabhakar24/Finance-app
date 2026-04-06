"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateUserCache = exports.getCachedUser = void 0;
const lru_cache_1 = require("lru-cache");
const user_model_1 = require("../modules/users/user.model");
// Section 3.1: Cache up to 500 users, TTL 60 seconds
const cache = new lru_cache_1.LRUCache({
    max: 500,
    ttl: 60 * 1000,
});
/**
 * Get user by ID, using in-memory cache.
 * Use for authentication reads only — never for writes.
 */
const getCachedUser = async (userId) => {
    const cached = cache.get(userId);
    if (cached)
        return cached;
    const user = await user_model_1.User.findById(userId)
        .select('name email phone role status isVerified lastLogin')
        .lean();
    if (user)
        cache.set(userId, user);
    return user;
};
exports.getCachedUser = getCachedUser;
/**
 * Invalidate user cache entry.
 * Call after: role change, status change, profile update, logout.
 */
const invalidateUserCache = (userId) => {
    cache.delete(userId);
};
exports.invalidateUserCache = invalidateUserCache;
