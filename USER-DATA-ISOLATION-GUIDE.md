# User Data Isolation - Complete Guide

## 🎯 How It Works

After login, each user fetches ONLY their own data based on their `userId`. The system has been fixed to ensure complete data isolation.

---

## 🔐 Data Flow After Login

### 1. User Logs In

```
User enters credentials → Backend validates → Returns JWT token with user data
```

The JWT token contains:

- `user._id` - The user's unique MongoDB ObjectId
- `user.role` - USER, ANALYST, or ADMIN
- `user.email`, `user.name`, etc.

### 2. Frontend Stores User Data

```typescript
// In auth.store.ts
setUser(user); // Stores user in Zustand state
setTokens(accessToken); // Stores token for API calls
```

The user data is persisted to localStorage under key `auth-storage`.

### 3. API Requests Include Token

```typescript
// In axios interceptor
headers: {
  Authorization: `Bearer ${accessToken}`;
}
```

Every API request includes the JWT token in the Authorization header.

### 4. Backend Authenticates & Resolves User

```typescript
// In authenticate middleware
const decoded = jwt.verify(token);
req.user = await User.findById(decoded.userId); // Loads full user object
```

The backend decodes the token and loads the user from database.

### 5. Backend Resolves Target User

```typescript
// In resolveTargetUser middleware
const userId = req.user._id.toString(); // 🔒 CRITICAL: Use _id not id

if (req.user.role === UserRole.USER) {
  req.targetUserId = userId; // USER always sees only themselves
} else if (req.user.role === UserRole.ANALYST) {
  req.targetUserId = req.query.userId || userId; // ANALYST can filter or see own
} else if (req.user.role === UserRole.ADMIN) {
  req.targetUserId = req.query.userId || undefined; // ADMIN can see all or filter
}
```

### 6. Backend Filters Data by userId

```typescript
// In dashboard.service.ts
const match = {
  isDeleted: false,
  userId: new Types.ObjectId(targetUserId), // 🔒 CRITICAL: Filter by userId
};

const records = await FinancialRecord.find(match);
```

All database queries include `userId` filter to return only that user's data.

### 7. Frontend Caches with userId

```typescript
// In queryClient.ts
queryKeys.dashboard.summary(user._id, year);
// Result: ['dashboard', 'summary', '507f1f77bcf86cd799439011', 2024]
```

React Query cache keys include `userId` to prevent cache collisions.

---

## 👥 Role-Based Data Access

### USER Role

```typescript
// USER can only see their own data
req.targetUserId = req.user._id.toString();

// Database query
{
  userId: ObjectId("507f1f77bcf86cd799439011");
}

// Result: Only records where userId matches logged-in user
```

**Example**:

- user@finance.dev logs in
- Gets userId: `507f1f77bcf86cd799439011`
- Dashboard shows only records with `userId: 507f1f77bcf86cd799439011`
- Cannot see data from user1@finance.dev

### ANALYST Role

```typescript
// ANALYST can see own data or filter by specific user
req.targetUserId = req.query.userId || req.user._id.toString();

// Database query (no filter)
{
  userId: ObjectId("507f1f77bcf86cd799439011");
}

// Database query (with filter)
{
  userId: ObjectId("123456789abcdef123456789");
}

// Result: Records for specified user (read-only)
```

**Example**:

- analyst@finance.dev logs in
- By default sees own data
- Can use dropdown to view user@finance.dev's data
- Cannot create/edit/delete records

### ADMIN Role

```typescript
// ADMIN can see all data or filter by specific user
req.targetUserId = req.query.userId || undefined;

// Database query (no filter)
{
  isDeleted: false;
} // No userId filter = all users

// Database query (with filter)
{
  userId: ObjectId("507f1f77bcf86cd799439011");
}

// Result: All records or filtered by specific user
```

**Example**:

- admin@finance.dev logs in
- Dashboard shows aggregated data from ALL users
- Can use dropdown to view specific user's data
- Can create/edit/delete any records

---

## 🔧 Setup Instructions

### Step 1: Run Database Migration

The migration adds `userId` field to all existing records:

```bash
cd Finance-app-improved/backend

# Run migration
npm run migrate:add-userId

# Or manually:
npx ts-node scripts/migrate-add-userId.ts
```

**What it does**:

- Finds all records without `userId` field
- Sets `userId = createdBy` for each record
- Ensures all records have proper user ownership

### Step 2: Restart Backend Server

**CRITICAL**: You MUST restart the backend for the fix to work!

```bash
# Stop current backend (Ctrl+C)

# Rebuild TypeScript
npm run build

# Start backend
npm run dev
```

### Step 3: Clear Browser Cache

Before testing, clear all browser data:

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check all boxes
5. Click "Clear site data"

Or use incognito mode for clean testing.

### Step 4: Test with Multiple Users

```bash
# Test User 1
1. Login as user@finance.dev
2. Note dashboard totals
3. Create a test record: "Test Income" - $1000
4. Logout

# Test User 2
5. Login as user1@finance.dev (or create new user)
6. Check dashboard totals
7. Should NOT see "Test Income"
8. Should have different totals

# Test Admin
9. Login as admin@finance.dev
10. Should see aggregated data from ALL users
11. Can filter by specific user using dropdown
```

---

## 🔍 Verification Checklist

### Backend Verification

```bash
# Check backend logs for targetUserId
# Should see actual ObjectIds, not undefined

✅ CORRECT:
targetUserId: 507f1f77bcf86cd799439011

❌ WRONG:
targetUserId: undefined
```

### Database Verification

```bash
# Connect to MongoDB
# Check records have userId field

db.records.find({ userId: { $exists: false } }).count()
# Should return 0

db.records.findOne()
# Should show userId field:
{
  _id: ObjectId("..."),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  createdBy: ObjectId("507f1f77bcf86cd799439011"),
  ...
}
```

### API Verification

```bash
# Open DevTools → Network tab
# Login as user@finance.dev
# Navigate to Dashboard
# Find API call to /api/dashboard/summary

# Check response:
{
  "success": true,
  "data": {
    "totalIncome": 50000,    # Only this user's income
    "totalExpense": 30000,   # Only this user's expense
    "netBalance": 20000
  }
}

# Logout and login as different user
# Response should have DIFFERENT values
```

### Frontend Cache Verification

```bash
# Open DevTools → Application → Local Storage
# Check auth-storage key

# Should contain:
{
  "state": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@finance.dev",
      ...
    },
    "accessToken": "eyJhbGc..."
  }
}

# After logout, should be cleared or reset
```

---

## 🐛 Troubleshooting

### Issue: User sees other users' data

**Cause**: Backend not restarted with fix

**Solution**:

```bash
# Kill backend process completely
# Rebuild and restart
cd backend
npm run build
npm run dev
```

### Issue: Dashboard shows 0 for all values

**Cause**: Records don't have userId field

**Solution**:

```bash
# Run migration
npm run migrate:add-userId

# Restart backend
npm run dev
```

### Issue: Same data after logout/login

**Cause**: React Query cache not cleared

**Solution**:

```bash
# Clear browser cache completely
# Or use incognito mode
# Or check auth.store.ts logout() function
```

### Issue: targetUserId is undefined in logs

**Cause**: Using req.user.id instead of req.user.\_id

**Solution**:

```typescript
// In authorize.ts
const userId = req.user._id.toString(); // ✅ CORRECT
// NOT: req.user.id  // ❌ WRONG
```

---

## 📊 Example Data Flow

### Scenario: Two users with different data

```
User A (user@finance.dev):
- userId: 507f1f77bcf86cd799439011
- Records: 50 records
- Total Income: $50,000
- Total Expense: $30,000

User B (user1@finance.dev):
- userId: 123456789abcdef123456789
- Records: 30 records
- Total Income: $40,000
- Total Expense: $25,000
```

### User A Logs In

```
1. Login → JWT token with userId: 507f1f77bcf86cd799439011
2. Dashboard API call → req.targetUserId = 507f1f77bcf86cd799439011
3. Database query → { userId: ObjectId("507f1f77bcf86cd799439011") }
4. Response → 50 records, $50k income, $30k expense
5. Frontend cache → ['dashboard', 'summary', '507f1f77bcf86cd799439011']
```

### User A Logs Out

```
1. Logout → queryClient.clear() (clears all cache)
2. localStorage.removeItem('auth-storage')
3. State reset → user: null, accessToken: null
```

### User B Logs In

```
1. Login → JWT token with userId: 123456789abcdef123456789
2. Dashboard API call → req.targetUserId = 123456789abcdef123456789
3. Database query → { userId: ObjectId("123456789abcdef123456789") }
4. Response → 30 records, $40k income, $25k expense
5. Frontend cache → ['dashboard', 'summary', '123456789abcdef123456789']
```

**Result**: User B sees DIFFERENT data than User A ✅

---

## 🎯 Key Takeaways

1. **Backend uses `req.user._id`** - This is the CRITICAL fix
2. **All queries filter by `userId`** - No query runs without userId for USER role
3. **Frontend cache includes `userId`** - Prevents cache collisions
4. **Logout clears everything** - Cache, localStorage, state
5. **Migration adds `userId` to records** - Ensures all records have ownership

---

## 📞 Support

If data isolation still doesn't work:

1. Check backend logs for `targetUserId` values
2. Verify migration ran successfully
3. Confirm backend was restarted (not just hot-reload)
4. Test in incognito mode to eliminate cache issues
5. Check database records have `userId` field

---

**Last Updated**: 2026-04-06  
**Status**: ✅ WORKING  
**Version**: 1.0
