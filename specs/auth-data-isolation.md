# Auth Data Isolation Specification

## Overview

This document defines the security invariants that MUST hold to prevent data leakage between users in the finance application. These rules were established after fixing a critical bug where User B could see User A's financial data after login.

---

## Critical Security Invariants

### 1. React Query Cache Scoping

**INVARIANT**: Every React Query key that touches user-specific data MUST include the `userId` as part of the key.

**Why**: React Query caches responses by key. Without `userId` in the key, User A's cached data remains in memory and is shown to User B after login.

**Implementation**:

```typescript
// ❌ WRONG - No userId, cache collision between users
queryKeys.dashboard.summary(year);

// ✅ CORRECT - userId prevents cache collision
queryKeys.dashboard.summary(userId, year);
```

**Files affected**:

- `frontend/src/api/queryClient.ts` - Query key factory (lines 48-85)
- `frontend/src/pages/DashboardPage.tsx` - Dashboard queries (lines 59-85)
- `frontend/src/pages/AnalyticsPage.tsx` - Analytics queries (lines 44-66)
- `frontend/src/pages/RecordsPage.tsx` - Records queries (lines 186-209)
- `frontend/src/pages/UsersPage.tsx` - Users queries (lines 44-89)

**Enforcement**: All query keys now require `userId` as first parameter after the entity name.

---

### 2. Cache Clearing on Logout

**INVARIANT**: `queryClient.clear()` MUST be the FIRST operation in the `logout()` function, executed SYNCHRONOUSLY before clearing auth state.

**Why**: If cache clearing happens asynchronously (via dynamic import), there's a race condition where:

1. Auth state is cleared
2. User navigates to login
3. Old cached data is still in memory
4. New user logs in and sees old data

**Implementation**:

```typescript
// ❌ WRONG - Async cache clear creates race condition
logout: () => {
  set({ user: null, accessToken: null });
  import("@/api/queryClient").then(({ queryClient }) => {
    queryClient.clear(); // Too late!
  });
};

// ✅ CORRECT - Synchronous cache clear before state change
logout: () => {
  // Clear cache FIRST
  if (typeof window !== "undefined") {
    const queryClient = (window as any).__REACT_QUERY_CLIENT__;
    if (queryClient) {
      queryClient.clear(); // Synchronous!
    }
  }

  // Then clear state
  set({ user: null, accessToken: null });

  // Also clear localStorage manually
  localStorage.removeItem(STORAGE_KEYS.AUTH);
};
```

**Files affected**:

- `frontend/src/store/auth.store.ts` - Logout function (lines 64-88)
- `frontend/src/api/queryClient.ts` - Global queryClient exposure (lines 40-43)

**Enforcement**: queryClient is exposed on `window.__REACT_QUERY_CLIENT__` for synchronous access.

---

### 3. Backend User Filtering

**INVARIANT**: No backend aggregation or query may run without a `userId` filter for USER role. ANALYST role without explicit `query.userId` MUST default to their own `userId`, NOT undefined.

**Why**: When `targetUserId` is `undefined`, MongoDB queries match ALL documents, leaking cross-user data.

**Implementation**:

```typescript
// ❌ WRONG - ANALYST without query.userId gets undefined
else if (req.user.role === UserRole.ANALYST && req.query?.userId) {
  req.targetUserId = req.query.userId as string;
}
// Falls through with undefined targetUserId!

// ✅ CORRECT - ANALYST defaults to own userId
else if (req.user.role === UserRole.ANALYST) {
  if (req.query?.userId) {
    req.targetUserId = req.query.userId as string;
  } else {
    req.targetUserId = req.user.id; // Default to self
  }
}
```

**Files affected**:

- `backend/src/middleware/authorize.ts` - resolveTargetUser (lines 62-95)
- `backend/src/dashboard/dashboard.service.ts` - All aggregations use targetUserId
- `backend/src/modules/records/record.service.ts` - All queries filter by userId

**Enforcement**:

- USER role: Always `req.targetUserId = req.user.id`
- ANALYST role: Defaults to `req.user.id` if no `query.userId`
- ADMIN role: Can be `undefined` (sees all) or specific userId

---

### 4. Stale Auth Clearing

**INVARIANT**: Login and register pages MUST clear any stale auth data on mount, before rendering the form.

**Why**: If a previous session crashed or logout failed, the old token persists in localStorage. The next user to open the app inherits that token and sees the previous user's data.

**Implementation**:

```typescript
// ✅ CORRECT - Clear stale auth on mount
export default function LoginPage() {
  const logout = useAuthStore((state) => state.logout);

  // 🔒 SECURITY: Clear any stale auth data on mount
  useEffect(() => {
    logout();
  }, [logout]);

  // ... rest of component
}
```

**Files affected**:

- `frontend/src/pages/auth/LoginPage.tsx` - Mount effect (lines 1-18)
- `frontend/src/pages/auth/RegisterPage.tsx` - Mount effect (lines 1-20)

**Enforcement**: Both pages call `logout()` in a mount effect before user interaction.

---

## Testing Checklist

To verify data isolation is working:

### Test 1: Basic Logout/Login

1. Login as User A
2. Create a record: $1000 "User A Record"
3. Note dashboard values
4. Logout
5. Login as User B
6. **VERIFY**: Dashboard shows 0 or User B's data only
7. **VERIFY**: "User A Record" is NOT visible

### Test 2: Browser Refresh

1. Login as User A
2. Refresh browser (F5)
3. **VERIFY**: Still shows User A's data (persistence works)
4. Logout
5. Login as User B
6. **VERIFY**: Shows User B's data only

### Test 3: Stale Token

1. Login as User A
2. Kill browser process (simulate crash)
3. Reopen browser, go to login page
4. **VERIFY**: Login page is clean (no auto-login with stale token)
5. Login as User B
6. **VERIFY**: Shows User B's data only

### Test 4: Query Key Isolation

1. Login as User A
2. Open DevTools → React Query Devtools
3. Note query keys include User A's ID
4. Logout
5. Login as User B
6. **VERIFY**: Query keys now include User B's ID
7. **VERIFY**: No queries from User A remain

### Test 5: ANALYST Role

1. Login as Analyst
2. Don't select any user filter
3. **VERIFY**: Shows analyst's own data, NOT all users' data
4. Select a specific user
5. **VERIFY**: Shows that user's data

---

## Code Review Checklist

When reviewing PRs that touch user data:

- [ ] Does the query key include `userId`?
- [ ] Is `enabled: !!user?._id` present on the query?
- [ ] Does the backend service filter by `targetUserId`?
- [ ] Are cache invalidations using `userId` in the key?
- [ ] Is `queryClient.clear()` called synchronously in logout?
- [ ] Do new auth pages clear stale auth on mount?

---

## Architecture Decisions

### Why userId in Query Keys?

**Alternative considered**: Clear cache on every login.

**Rejected because**:

- Doesn't prevent race conditions during logout
- Loses performance benefits of caching
- Doesn't prevent stale data if logout fails

**Chosen approach**: Include userId in every key.

- Guarantees isolation at cache level
- Allows safe caching per user
- No race conditions possible

### Why Synchronous Cache Clear?

**Alternative considered**: Async cache clear with Promise.

**Rejected because**:

- Race condition: logout completes before cache clears
- User can navigate to login while old cache exists
- Next login shows stale data

**Chosen approach**: Synchronous access via global window object.

- No race conditions
- Cache cleared before state change
- Guaranteed clean slate for next user

### Why Default ANALYST to Own userId?

**Alternative considered**: ANALYST always requires explicit userId.

**Rejected because**:

- Breaking change for existing analyst workflows
- Confusing UX (analyst sees nothing by default)
- Doesn't match RBAC expectations

**Chosen approach**: Default to analyst's own userId.

- Secure by default (no data leakage)
- Analyst can still filter by other users
- Matches USER role behavior

---

## Monitoring & Alerts

### Metrics to Track

1. **Cache Hit Rate by User**: Should reset to 0% after login
2. **Query Keys with Missing userId**: Should be 0
3. **Backend Queries without userId Filter**: Should be 0 for USER/ANALYST
4. **Failed Logouts**: Track localStorage clear failures

### Alerts to Set

1. Alert if any query key doesn't include userId (static analysis)
2. Alert if cache hit rate > 0% immediately after login
3. Alert if backend query runs without userId for non-ADMIN

---

## Migration Guide

If you have existing code that doesn't follow these invariants:

### Step 1: Update Query Keys

```typescript
// Before
queryKeys.dashboard.summary(year);

// After
queryKeys.dashboard.summary(user._id, year);
```

### Step 2: Add enabled Guards

```typescript
// Before
useQuery({
  queryKey: queryKeys.dashboard.summary(user._id, year),
  queryFn: () => getSummary(),
});

// After
useQuery({
  queryKey: queryKeys.dashboard.summary(user._id, year),
  queryFn: () => getSummary(),
  enabled: !!user?._id, // Don't fetch without user
});
```

### Step 3: Update Invalidations

```typescript
// Before
queryClient.invalidateQueries({ queryKey: queryKeys.records.all });

// After
queryClient.invalidateQueries({ queryKey: queryKeys.records.all(user._id) });
```

### Step 4: Fix Backend Middleware

```typescript
// Before
else if (req.user.role === UserRole.ANALYST && req.query?.userId) {
  req.targetUserId = req.query.userId as string;
}

// After
else if (req.user.role === UserRole.ANALYST) {
  req.targetUserId = req.query?.userId as string || req.user.id;
}
```

---

## References

- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [Zustand Persist Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
- [MongoDB Query Filtering](https://www.mongodb.com/docs/manual/tutorial/query-documents/)

---

**Last Updated**: 2026-04-06  
**Status**: ✅ IMPLEMENTED  
**Severity**: P0 - Critical Security Issue  
**Impact**: Prevents cross-user data leakage
