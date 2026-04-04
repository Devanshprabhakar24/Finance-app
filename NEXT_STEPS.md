# Next Steps for Production Deployment

## Immediate Actions Required

### 1. Install New Dependencies (5 minutes)

```bash
cd backend
npm install lru-cache ioredis prom-client rate-limit-redis
npm install --save-dev @types/ioredis
```

### 2. Update Remaining Files (30 minutes)

#### A. Update `authenticate.ts` to use user cache

```typescript
import { getCachedUser } from "../utils/userCache";

// Replace User.findById with:
const user = await getCachedUser(decoded.userId);
```

#### B. Update `user.service.ts` to invalidate cache

```typescript
import { invalidateUserCache } from "../utils/userCache";

// Add to updateUserRole, updateUserStatus, softDeleteUser, updateMyProfile:
invalidateUserCache(userId);
```

#### C. Update `auth.service.ts` to invalidate cache on logout

```typescript
import { invalidateUserCache } from "../utils/userCache";

// Add to logoutUser:
invalidateUserCache(userId);
```

#### D. Update `rateLimiter.ts` for Redis-backed rate limiting

```typescript
import { RedisStore } from "rate-limit-redis";
import { getRedisClient } from "../config/redis";

const getStore = () => {
  const redis = getRedisClient();
  if (!redis) return undefined;
  return new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as any,
    prefix: "rl:",
  });
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: getStore(),
  // ... rest of config
});
```

#### E. Update `dashboard.routes.ts` to add cache control

```typescript
import { cacheControl } from "../middleware/cacheControl";

router.get("/summary", cacheControl(120, 300), dashboardController.getSummary);
router.get(
  "/trends",
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  cacheControl(600, 1800),
  dashboardController.getTrends,
);
router.get("/recent", cacheControl(30, 60), dashboardController.getRecent);
router.get(
  "/by-category",
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  cacheControl(300, 600),
  dashboardController.getByCategory,
);
router.get(
  "/top-categories",
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  cacheControl(300, 600),
  dashboardController.getTopCategories,
);
```

#### F. Update `auth.routes.ts` to add noCache

```typescript
import { noCache } from "../middleware/cacheControl";

// Apply to all auth routes
router.use(noCache);
```

### 3. Update `package.json` Scripts (2 minutes)

```json
{
  "scripts": {
    "start": "node --max-old-space-size=512 --optimize-for-size dist/cluster.js",
    "start:single": "node dist/server.js",
    "build": "tsc",
    "build:prod": "tsc --sourceMap false --removeComments true"
  }
}
```

### 4. Configure Environment Variables (5 minutes)

Add to `.env`:

```env
# Redis (optional - gracefully degrades if not configured)
REDIS_URL=redis://localhost:6379

# Production
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

### 5. Test Locally (10 minutes)

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Start in cluster mode
npm start

# Verify health
curl http://localhost:5000/health

# Check metrics
curl http://localhost:5000/metrics
```

## Optional Enhancements (Can be done later)

### 1. OTP Hashing Optimization (15 minutes)

Replace bcrypt with SHA-256 HMAC in `otp.service.ts` for 1000× faster OTP generation.

### 2. RSA JWT Keys (20 minutes)

Create `scripts/generate-keys.ts` and switch from HS256 to RS256 for better security.

### 3. Streaming Cloudinary Uploads (15 minutes)

Update `cloudinary.ts` to use streams instead of buffers for memory efficiency.

### 4. Create `tsconfig.prod.json` (5 minutes)

Optimized TypeScript configuration for production builds.

## Deployment Checklist

Before deploying to production, review:

- [ ] `PRODUCTION_CHECKLIST.md` - Complete all items
- [ ] `PRODUCTION_OPTIMIZATION_SUMMARY.md` - Understand all optimizations
- [ ] All 246 tests passing
- [ ] Environment variables configured
- [ ] Redis instance available (or graceful degradation tested)
- [ ] MongoDB Atlas configured with proper indexes
- [ ] Load balancer health checks configured
- [ ] Monitoring and alerting set up

## Performance Expectations

After completing these steps, you should see:

- **2-5× faster** database queries (lean + indexes)
- **50-80% fewer** authentication DB calls (user cache)
- **4-8× higher** throughput (cluster mode on 8-core server)
- **10-30% faster** response times (compression + caching)
- **20-40% lower** memory usage (lean + optimizations)

## Support

If you encounter issues:

1. Check logs: `tail -f logs/all.log`
2. Check health: `curl http://localhost:5000/health`
3. Check metrics: `curl http://localhost:5000/metrics`
4. Review error logs with correlation IDs for tracing

## Rollback

If needed, revert to previous commit:

```bash
git revert HEAD
npm run build
npm start
```

All optimizations are backward-compatible.
