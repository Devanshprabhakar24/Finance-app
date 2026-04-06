# Production Migration Guide

## Running the userId Migration in Production

This guide explains how to run the database migration on your production environment (Render).

## What the Migration Does

1. Adds `userId` field to all existing financial records
2. Converts any users with `VIEWER` role to `USER` role
3. Ensures data isolation between users

## Option 1: Run via API (Easiest - Recommended)

### Step 1: Login as Admin

1. Go to your production frontend: https://finance-app-one-zeta.vercel.app
2. Login with admin credentials
3. Open browser DevTools (F12) → Console tab

### Step 2: Check Migration Status

```javascript
// Check if migration is needed
fetch("https://finance-app-ddaf.onrender.com/api/migrate/status", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
})
  .then((r) => r.json())
  .then(console.log);
```

### Step 3: Run Migration

```javascript
// Run the migration
fetch("https://finance-app-ddaf.onrender.com/api/migrate/add-userId", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
})
  .then((r) => r.json())
  .then(console.log);
```

### Step 4: Verify

You should see output like:

```json
{
  "success": true,
  "message": "Migration completed successfully",
  "data": {
    "recordsMigrated": 10,
    "recordsFailed": 0,
    "userRolesMigrated": 1
  }
}
```

### Step 5: Test

1. Logout and login as a new user
2. Dashboard should be empty
3. Create a test record
4. Logout and login as different user
5. Should NOT see the first user's record

## Option 2: Run via Render Shell

### Step 1: Access Render Shell

1. Go to https://dashboard.render.com
2. Navigate to your backend service
3. Click on the "Shell" tab
4. Wait for the shell to connect

### Step 2: Run Migration

```bash
# Navigate to app directory (usually /opt/render/project/src)
cd /opt/render/project/src

# Run the production migration
npm run migrate:userId:prod
```

### Step 3: Verify

Check the output for:

- ✅ Successfully migrated: X records
- ✅ User roles migrated successfully

### Step 4: Restart Service

The migration will complete, but you should restart the service:

1. Go back to Render dashboard
2. Click "Manual Deploy" → "Clear build cache & deploy"
3. Or use the "Restart" button

## Option 2: Run via Local Connection to Production DB

### Step 1: Get Production MongoDB URI

1. Go to Render dashboard
2. Navigate to your backend service
3. Go to "Environment" tab
4. Copy the `MONGODB_URI` value

### Step 2: Run Migration Locally

```bash
# In your local backend directory
cd Finance-app-improved/backend

# Set production MongoDB URI temporarily
export MONGODB_URI="your-production-mongodb-uri"

# Run migration
npm run migrate:userId

# Or on Windows PowerShell:
$env:MONGODB_URI="your-production-mongodb-uri"
npm run migrate:userId
```

### Step 3: Restart Production Service

Go to Render dashboard and restart your backend service.

## Option 3: Automatic Migration on Startup

If you want the migration to run automatically when the app starts, you can modify the startup process.

### Update package.json

```json
"scripts": {
  "start": "npm run migrate:userId:prod && node dist/server.js"
}
```

⚠️ **Warning:** This will run the migration every time the service restarts. The migration is idempotent (safe to run multiple times), but it adds startup time.

## Verification Steps

After running the migration:

### 1. Check Logs

Look for these messages in Render logs:

```
✅ Connected to database
✅ User roles migrated successfully
✅ Successfully migrated: X records
```

### 2. Test with New User

1. Register a new user account
2. Login and check dashboard
3. Should see empty state (no records)
4. Create a test record
5. Logout and login as different user
6. Should NOT see the first user's record

### 3. Test Existing Users

1. Login as existing user (admin, analyst, or user)
2. Should see their own records
3. Admin/Analyst should be able to filter by user
4. Regular users should only see their own data

## Troubleshooting

### Migration Fails with "Connection Timeout"

**Solution:** Your MongoDB Atlas might have IP whitelist restrictions.

1. Go to MongoDB Atlas dashboard
2. Network Access → Add IP Address
3. Add Render's IP or allow all (0.0.0.0/0) temporarily
4. Run migration again
5. Remove the IP after migration

### Migration Shows "0 records migrated"

**Possible reasons:**

1. Migration already ran successfully
2. All records already have `userId` field
3. No records in database

**Verify:**

```bash
# In Render shell or MongoDB shell
db.financialrecords.findOne()
# Check if the record has a "userId" field
```

### Users Still See Other Users' Data

**Solutions:**

1. **Clear browser cache:** Users might have cached data
   - Press Ctrl+Shift+R (hard refresh)
   - Or clear browser cache completely

2. **Logout and login again:** Force new token generation

3. **Check migration ran:** Verify records have `userId` field

4. **Restart backend:** Ensure new code is running

## Rollback (Emergency Only)

If something goes wrong and you need to rollback:

```javascript
// In MongoDB shell or Compass
// This removes the userId field from all records
db.financialrecords.updateMany({}, { $unset: { userId: "" } });

// Revert USER roles back to VIEWER
db.users.updateMany({ role: "USER" }, { $set: { role: "VIEWER" } });
```

⚠️ **Warning:** Only do this if absolutely necessary. You'll need to revert your code changes too.

## Post-Migration Checklist

- [ ] Migration completed successfully
- [ ] Backend service restarted
- [ ] New users see empty dashboard
- [ ] Existing users see only their own records
- [ ] Admin can filter by user
- [ ] Analyst can filter by user (read-only)
- [ ] No errors in production logs

## Support

If you encounter issues:

1. Check Render logs for error messages
2. Verify MongoDB connection is working
3. Ensure all environment variables are set correctly
4. Check that the build completed successfully

## Migration Script Location

The migration script is located at:

```
backend/scripts/migrate-add-userId.ts
```

After build, the compiled version is at:

```
backend/dist/scripts/migrate-add-userId.js
```

## Important Notes

- ✅ Migration is **idempotent** (safe to run multiple times)
- ✅ Migration does **NOT** delete any data
- ✅ Migration only **adds** the `userId` field
- ✅ Existing records are assigned to their creator
- ⚠️ Takes ~1 second per 1000 records
- ⚠️ Large databases (>100k records) may take several minutes

## Questions?

If you have questions or issues, check:

- Render logs: https://dashboard.render.com → Your Service → Logs
- MongoDB Atlas logs: https://cloud.mongodb.com → Your Cluster → Metrics
