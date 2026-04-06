# Testing Guide - Data Isolation Fix

## 🎯 Purpose

This guide helps you verify that the critical data isolation bug has been fixed. After following these steps, each user should only see their own financial data.

---

## ✅ Pre-Testing Checklist

Before testing, ensure:

- [ ] Backend has been rebuilt: `cd backend && npm run build`
- [ ] Backend server has been restarted (kill and restart the process)
- [ ] Frontend has been rebuilt: `cd frontend && npm run build` (if testing production)
- [ ] All browser cache cleared (or use incognito mode)
- [ ] localStorage cleared in browser DevTools

---

## 🧪 Test Scenarios

### Test 1: User Role Data Isolation

**Objective**: Verify USER role only sees their own data

**Steps**:

1. Clear browser cache and localStorage
2. Login as `user@user.com` (password from your .env)
3. Navigate to Dashboard
4. Note the financial summary (income, expense, balance)
5. Create a test record: "User Test Income" - $500 - INCOME
6. Logout completely
7. Login as `user1@user.com` (different user)
8. Navigate to Dashboard
9. Check financial summary

**Expected Result**:

- ✅ user1@user.com should NOT see "User Test Income"
- ✅ user1@user.com should have different totals
- ✅ user1@user.com should only see their own records

**Failure Indicators**:

- ❌ Seeing the same totals as user@user.com
- ❌ Seeing "User Test Income" in recent transactions
- ❌ Record count matches previous user

---

### Test 2: Analyst Role Data Isolation

**Objective**: Verify ANALYST role sees only their own data by default

**Steps**:

1. Clear browser cache and localStorage
2. Login as user with ANALYST role
3. Navigate to Dashboard
4. Check financial summary
5. Navigate to Analytics page
6. Verify data shown

**Expected Result**:

- ✅ ANALYST sees only their own financial data by default
- ✅ ANALYST can use user filter dropdown to view specific users
- ✅ When no user selected, shows ANALYST's own data

**Failure Indicators**:

- ❌ Seeing aggregated data from all users
- ❌ Seeing records they didn't create

---

### Test 3: Admin Role Full Access

**Objective**: Verify ADMIN can see all users' data

**Steps**:

1. Clear browser cache and localStorage
2. Login as `admin@fin.com` (or your admin account)
3. Navigate to Dashboard
4. Check financial summary (should show all users' data)
5. Navigate to Users page
6. Verify all users are listed
7. Navigate to Analytics page
8. Use user filter to view specific user's data

**Expected Result**:

- ✅ ADMIN sees aggregated data from all users by default
- ✅ ADMIN can filter by specific user
- ✅ ADMIN can manage all users

---

### Test 4: Cache Isolation Between Users

**Objective**: Verify React Query cache doesn't leak between users

**Steps**:

1. Login as `user@user.com`
2. Navigate to Dashboard (data loads)
3. Open browser DevTools → Application → Local Storage
4. Note the `auth-storage` key
5. Logout (should clear cache)
6. Verify `auth-storage` is removed or cleared
7. Login as `user1@user.com`
8. Navigate to Dashboard
9. Open DevTools → Network tab
10. Verify API calls are made (not served from cache)

**Expected Result**:

- ✅ Logout clears localStorage
- ✅ New login makes fresh API calls
- ✅ No cached data from previous user

**Failure Indicators**:

- ❌ Dashboard loads instantly without API calls
- ❌ Seeing previous user's data briefly before refresh
- ❌ `auth-storage` still contains old user data

---

### Test 5: Stale Token Prevention

**Objective**: Verify login/register pages clear stale auth

**Steps**:

1. Login as `user@user.com`
2. Navigate to Dashboard
3. Manually navigate to `/login` (without logging out)
4. Check if you're redirected or if stale auth is cleared
5. Close browser completely
6. Reopen browser and go directly to `/login`
7. Login as `user1@user.com`

**Expected Result**:

- ✅ Login page clears any stale auth on mount
- ✅ New user starts with completely clean state
- ✅ No data from previous session

---

### Test 6: Backend API Verification

**Objective**: Verify backend returns correct data

**Steps**:

1. Login as `user@user.com`
2. Open DevTools → Network tab
3. Navigate to Dashboard
4. Find the API call to `/api/dashboard/summary`
5. Check the response data
6. Note the totals
7. Logout and login as `user1@user.com`
8. Navigate to Dashboard
9. Check the same API call
10. Compare response data

**Expected Result**:

- ✅ Different users get different response data
- ✅ Response includes only user-specific records
- ✅ Totals are different between users

**Failure Indicators**:

- ❌ Same response data for different users
- ❌ Response includes records from other users
- ❌ Totals are identical

---

## 🔍 Debugging Tips

### If Test Fails

1. **Check Backend Logs**

   ```bash
   # Look for targetUserId in logs
   # Should be actual ObjectId, not undefined
   ```

2. **Verify Backend Restart**

   ```bash
   # Kill the backend process completely
   # Restart with: npm run dev
   ```

3. **Clear All Cache**

   ```bash
   # Browser: DevTools → Application → Clear Storage
   # Click "Clear site data"
   ```

4. **Check Network Requests**

   ```bash
   # DevTools → Network
   # Look for Authorization header
   # Verify different tokens for different users
   ```

5. **Verify Database**
   ```bash
   # Connect to MongoDB
   # Check records have userId field
   # Verify userId matches user's _id
   ```

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Test 1 - User Data Isolation: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 2 - Analyst Data Isolation: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 3 - Admin Full Access: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 4 - Cache Isolation: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 5 - Stale Token Prevention: [ ] PASS [ ] FAIL
Notes: _________________________________

Test 6 - Backend API Verification: [ ] PASS [ ] FAIL
Notes: _________________________________

Overall Status: [ ] ALL PASS [ ] SOME FAILURES

Issues Found:
_________________________________
_________________________________
```

---

## 🚀 Quick Test (5 minutes)

If you're short on time, run this quick test:

1. Clear browser cache
2. Login as `user@user.com`
3. Note dashboard totals
4. Logout
5. Login as `user1@user.com`
6. Check dashboard totals

**Expected**: Different totals for different users  
**If Same**: Bug still exists, check backend restart

---

## 📞 Support

If tests fail after following this guide:

1. Check `CRITICAL-BUG-FIX.md` for technical details
2. Verify backend was rebuilt: `npm run build`
3. Verify backend was restarted (not just hot-reload)
4. Check backend logs for `targetUserId` values
5. Verify `req.user._id` is used (not `req.user.id`)

---

**Last Updated**: 2026-04-06  
**Version**: 1.0  
**Status**: Ready for Testing
