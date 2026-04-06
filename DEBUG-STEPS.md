# Debug Steps - Data Leakage Issue

## Immediate Actions to Take

### Step 1: Check Browser Console

Open browser DevTools (F12) and check:

1. Console tab - look for any errors
2. Network tab - check API requests to `/api/dashboard/summary`
3. Application tab → Local Storage → Check `auth-storage` key

### Step 2: Check What User is Logged In

In browser console, type:

```javascript
JSON.parse(localStorage.getItem("auth-storage"));
```

This will show you:

- Which user is logged in
- Their user ID
- Their access token

### Step 3: Check API Request

In Network tab:

1. Find the request to `/api/dashboard/summary`
2. Check Request Headers → Look for `Authorization: Bearer <token>`
3. Check Response → See what data is returned

### Step 4: Verify Backend is Running Latest Code

```bash
cd backend
# Check if migration was run
npm run migrate:userId

# Restart backend
npm run dev
```

### Step 5: Hard Reset Frontend

```bash
# In browser console
localStorage.clear()
sessionStorage.clear()

# Then hard refresh
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Step 6: Test Fresh Login

1. Close all browser tabs
2. Open new incognito/private window
3. Go to http://localhost:3000
4. Login as `user@user.dev` / `Devansh24@` / OTP: `123456`
5. Check dashboard - should show 0 or only user's data

## What to Look For

### If you see ₹45,445:

This is likely data from another user. Check:

1. Who created that record in MongoDB
2. What userId is on that record
3. What user is currently logged in

### MongoDB Check

```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Check records
use your-database-name
db.financialrecords.find({}).pretty()

# Look for:
# - Does each record have a userId field?
# - Does the userId match the user who should own it?
```

## Quick Fix Commands

### Clear Everything and Start Fresh

```bash
# Backend - clear all data and reseed
cd backend
npm run seed

# Frontend - clear cache
# In browser console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Check Migration Status

```bash
# In browser, go to:
http://localhost:8000/api/migrate/status

# Should show:
# - Total records
# - Records with userId
# - Records without userId (should be 0)
```

## Expected Behavior

### For user@user.dev (USER role):

- Should see ONLY their own records
- Dashboard should show their income/expense
- Should NOT see records created by admin or analyst

### For admin@fin.com (ADMIN role):

- Can see all records
- Can filter by user
- Can create records for any user

### For analyst@fin.dev (ANALYST role):

- Can see all records (read-only)
- Can filter by user
- Cannot create/edit/delete

## If Still Not Working

### Check Backend Logs

```bash
cd backend
# Look at logs/all.log
tail -f logs/all.log

# Look for:
# - Which userId is being used in queries
# - Any errors in dashboard service
```

### Add Debug Logging

In `backend/src/dashboard/dashboard.service.ts`, add:

```typescript
console.log("Dashboard query match:", match);
console.log("Target userId:", targetUserId);
```

### Check Frontend Network Requests

In browser DevTools → Network tab:

1. Filter by "dashboard"
2. Click on `/api/dashboard/summary` request
3. Check:
   - Request URL (any userId param?)
   - Request Headers (Authorization token?)
   - Response (what data is returned?)

## Nuclear Option - Complete Reset

If nothing works:

```bash
# 1. Stop all servers
# 2. Clear MongoDB completely
mongosh "your-connection-string"
use your-database-name
db.financialrecords.deleteMany({})
db.users.deleteMany({})

# 3. Reseed database
cd backend
npm run seed

# 4. Clear browser completely
# In browser console:
localStorage.clear()
sessionStorage.clear()
indexedDB.deleteDatabase('keyval-store')

# 5. Close browser completely
# 6. Restart backend
npm run dev

# 7. Restart frontend
cd ../frontend
npm run dev

# 8. Open new incognito window
# 9. Login fresh
```

## Contact Points

If issue persists, provide:

1. Screenshot of browser console (F12)
2. Screenshot of Network tab showing API request/response
3. Output of `localStorage.getItem('auth-storage')`
4. Output of migration status endpoint
5. Backend logs (last 50 lines)
