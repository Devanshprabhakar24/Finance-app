# Security Testing Checklist

## 🎯 Purpose

This checklist ensures that the data isolation bug has been completely fixed and no user can see another user's data.

## ✅ Pre-Testing Setup

- [ ] Backend is running with latest code
- [ ] Frontend is running with latest code
- [ ] Database migration has been run (`npm run migrate:userId`)
- [ ] All records in MongoDB have `userId` field (check via `/api/migrate/status`)

## 🧪 Test Cases

### Test 1: Basic Login/Logout Flow

**Steps**:

1. [ ] Open app in incognito/private window
2. [ ] Login as `admin@fin.com` / `Admin@123` / OTP: `123456`
3. [ ] Note the dashboard values (income, expense, balance)
4. [ ] Create a new income record: $500 "Test Admin Income"
5. [ ] Verify dashboard updates to show new income
6. [ ] Click logout
7. [ ] Verify redirected to login page

**Expected Result**: ✅ Logout successful, redirected to login

---

### Test 2: Login as Different User - No Data Leakage

**Steps**:

1. [ ] Login as `user@user.dev` / `Devansh24@` / OTP: `123456`
2. [ ] Check dashboard values
3. [ ] Go to dashboard (should NOT see Transactions in sidebar)
4. [ ] Check if "Test Admin Income" record is visible

**Expected Result**:

- ✅ Should NOT see admin's "Test Admin Income" record
- ✅ Should NOT see admin's dashboard values
- ✅ Should see only user's own data (or empty if no data)
- ✅ Transactions page should NOT be in sidebar

---

### Test 3: Create Record as Regular User

**Steps**:

1. [ ] Still logged in as `user@user.dev`
2. [ ] Create a new expense record: $100 "Test User Expense"
3. [ ] Verify dashboard shows this expense
4. [ ] Note the dashboard values
5. [ ] Logout

**Expected Result**: ✅ User can create and see their own records

---

### Test 4: Verify Data Isolation After Multiple Logins

**Steps**:

1. [ ] Login as `admin@fin.com`
2. [ ] Check dashboard - should see admin's data including "Test Admin Income"
3. [ ] Should NOT see "Test User Expense"
4. [ ] Logout
5. [ ] Login as `user@user.dev`
6. [ ] Check dashboard - should see user's data including "Test User Expense"
7. [ ] Should NOT see "Test Admin Income"

**Expected Result**: ✅ Each user sees only their own data

---

### Test 5: Analyst Read-Only Access

**Steps**:

1. [ ] Login as `analyst@fin.dev` / `Analyst123@` / OTP: `123456`
2. [ ] Go to Transactions page (should be visible in sidebar)
3. [ ] Verify can see all records from all users
4. [ ] Try to edit a record - should see no edit button
5. [ ] Try to delete a record - should see no delete button
6. [ ] Try to create a record - should see no create button
7. [ ] Go to Analytics page
8. [ ] Select a user from dropdown
9. [ ] Verify analytics updates for selected user

**Expected Result**:

- ✅ Analyst can view all records (read-only)
- ✅ Analyst cannot create/edit/delete records
- ✅ Analyst can filter analytics by user

---

### Test 6: Admin User Management

**Steps**:

1. [ ] Login as `admin@fin.com`
2. [ ] Go to Transactions page
3. [ ] Click "Add Record" button
4. [ ] Verify "User" dropdown is visible
5. [ ] Select a user from dropdown
6. [ ] Create a record for that user
7. [ ] Logout and login as that user
8. [ ] Verify the record is visible to that user

**Expected Result**: ✅ Admin can create records for any user

---

### Test 7: Browser Refresh Persistence

**Steps**:

1. [ ] Login as `user@user.dev`
2. [ ] Note the dashboard values
3. [ ] Refresh browser (F5)
4. [ ] Verify still logged in
5. [ ] Verify dashboard shows same values

**Expected Result**: ✅ Session persists after refresh

---

### Test 8: New User Registration

**Steps**:

1. [ ] Logout if logged in
2. [ ] Click "Register" or go to `/register`
3. [ ] Fill in registration form:
   - Name: "Test New User"
   - Email: "newuser@test.com"
   - Phone: "+919876543210"
   - Password: "Test@12345"
4. [ ] Complete OTP verification (use `123456`)
5. [ ] Check dashboard

**Expected Result**:

- ✅ Registration successful
- ✅ Dashboard shows all zeros (no data)
- ✅ No records from other users visible
- ✅ Can create own records

---

### Test 9: Cache Clearing Verification

**Steps**:

1. [ ] Open browser DevTools (F12)
2. [ ] Go to Console tab
3. [ ] Login as `admin@fin.com`
4. [ ] Create a record
5. [ ] In console, type: `localStorage`
6. [ ] Note the stored data
7. [ ] Logout
8. [ ] Check console - should see cache being cleared
9. [ ] Login as `user@user.dev`
10. [ ] Check console - should see fresh data being fetched

**Expected Result**: ✅ Cache is cleared on logout and login

---

### Test 10: API Token Validation

**Steps**:

1. [ ] Login as `user@user.dev`
2. [ ] Open DevTools → Network tab
3. [ ] Go to Transactions page
4. [ ] Find the API request to `/api/records`
5. [ ] Check Request Headers
6. [ ] Verify `Authorization: Bearer <token>` is present
7. [ ] Copy the token
8. [ ] Logout
9. [ ] Login as `admin@fin.com`
10. [ ] Check Network tab again
11. [ ] Verify token is DIFFERENT from previous user

**Expected Result**: ✅ Each user gets a unique token

---

## 🔍 Advanced Testing

### Test 11: Direct API Access (Security)

**Steps**:

1. [ ] Login as `user@user.dev`
2. [ ] Open DevTools → Console
3. [ ] Try to fetch admin's records directly:
   ```javascript
   fetch("http://localhost:8000/api/records", {
     headers: {
       Authorization:
         "Bearer " + localStorage.getItem("auth-storage").accessToken,
     },
   })
     .then((r) => r.json())
     .then(console.log);
   ```
4. [ ] Check response

**Expected Result**: ✅ Should only return user's own records, not admin's

---

### Test 12: MongoDB Data Verification

**Steps**:

1. [ ] Connect to MongoDB (Atlas or local)
2. [ ] Open `records` collection
3. [ ] Check a few records
4. [ ] Verify each record has:
   - `userId` field (ObjectId)
   - `createdBy` field (ObjectId)
5. [ ] Verify `userId` matches the user who owns the record

**Expected Result**: ✅ All records have proper `userId` field

---

## 🚨 Red Flags (Should NOT Happen)

❌ Seeing another user's records after login  
❌ Dashboard showing data from previous user  
❌ Records list showing mixed data from multiple users  
❌ Analytics showing incorrect user's data  
❌ Cache not clearing on logout  
❌ Same token being used for different users  
❌ Records without `userId` field in database

---

## 📊 Test Results

| Test Case                 | Status | Notes |
| ------------------------- | ------ | ----- |
| Test 1: Login/Logout      | ⬜     |       |
| Test 2: No Data Leakage   | ⬜     |       |
| Test 3: Create Record     | ⬜     |       |
| Test 4: Data Isolation    | ⬜     |       |
| Test 5: Analyst Access    | ⬜     |       |
| Test 6: Admin Management  | ⬜     |       |
| Test 7: Browser Refresh   | ⬜     |       |
| Test 8: New Registration  | ⬜     |       |
| Test 9: Cache Clearing    | ⬜     |       |
| Test 10: Token Validation | ⬜     |       |
| Test 11: API Security     | ⬜     |       |
| Test 12: MongoDB Data     | ⬜     |       |

**Legend**: ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## 🎉 Sign-Off

- [ ] All test cases passed
- [ ] No data leakage observed
- [ ] Cache clearing working correctly
- [ ] Token management working correctly
- [ ] Backend data isolation verified
- [ ] Frontend security verified
- [ ] Ready for production deployment

**Tested By**: ********\_********

**Date**: ********\_********

**Environment**: [ ] Local [ ] Staging [ ] Production

**Notes**:

```
[Add any additional notes or observations here]
```

---

## 📚 Related Documentation

- [Frontend Security Fix](./FRONTEND-SECURITY-FIX.md)
- [Backend Security Fix](./SECURITY-FIX-DATA-ISOLATION.md)
- [Production Migration Guide](./PRODUCTION-MIGRATION.md)
