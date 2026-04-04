# Testing Guide

Complete guide to testing the Finance Dashboard application.

---

## 🎯 Quick Test (5 Minutes)

### 1. Check Servers Are Running

Both servers should already be running:

```bash
# Check backend (Terminal 7)
curl http://localhost:5000/health

# Expected: {"status":"ok","timestamp":"..."}

# Check frontend (Terminal 8)
curl http://localhost:3000

# Expected: HTML content
```

### 2. Open Application

Open your browser and go to:

- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:5000/api/docs

### 3. Quick Registration Test

1. Go to http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Fill in registration form:
   - Name: Test User
   - Email: test@example.com
   - Phone: +1234567890
   - Password: Test@12345
4. Click "Register"
5. You should see "OTP sent" message

### 4. Verify OTP

Since test mode is enabled, use OTP: **123456**

1. Enter OTP: 123456
2. Click "Verify"
3. You should be logged in and see the dashboard!

---

## 🧪 Complete Manual Testing

### Test 1: User Registration Flow

**Steps:**

1. Open http://localhost:3000
2. Click "Sign Up" or "Get Started"
3. Fill registration form:
   ```
   Name: John Doe
   Email: john@test.com
   Phone: +1234567890
   Password: Test@12345
   ```
4. Click "Register"

**Expected:**

- ✅ Form validation works
- ✅ Success message appears
- ✅ Redirected to OTP verification page
- ✅ OTP sent (check backend logs)

**Verify OTP:**

1. Enter OTP: `123456` (test mode)
2. Click "Verify"

**Expected:**

- ✅ OTP verified successfully
- ✅ Redirected to dashboard
- ✅ User logged in

---

### Test 2: Login Flow

**Steps:**

1. Logout (if logged in)
2. Go to http://localhost:3000/login
3. Enter credentials:
   ```
   Email/Phone: john@test.com
   Password: Test@12345
   ```
4. Click "Sign In"

**Expected:**

- ✅ OTP sent message
- ✅ Redirected to OTP verification

**Verify OTP:**

1. Enter OTP: `123456`
2. Click "Verify"

**Expected:**

- ✅ Logged in successfully
- ✅ Dashboard loads

---

### Test 3: Forgot Password Flow

**Steps:**

1. Logout
2. Go to http://localhost:3000/login
3. Click "Forgot password?"
4. Enter email: `john@test.com`
5. Click "Send Reset OTP"

**Expected:**

- ✅ OTP sent message
- ✅ Redirected to reset password page

**Reset Password:**

1. Enter email: `john@test.com`
2. Enter OTP: `123456`
3. Enter new password: `NewTest@12345`
4. Confirm password: `NewTest@12345`
5. Click "Reset Password"

**Expected:**

- ✅ Password reset successfully
- ✅ Redirected to login
- ✅ Can login with new password

---

### Test 4: Profile Management

**Steps:**

1. Login as any user
2. Go to http://localhost:3000/dashboard/profile
3. Click "Edit" on profile section
4. Change name to: "John Updated"
5. Change phone to: "+9876543210"
6. Click "Save Changes"

**Expected:**

- ✅ Profile updated successfully
- ✅ Changes reflected immediately

**Test Avatar Upload:**

1. Click on avatar upload button
2. Select an image (JPEG/PNG/WebP, max 5MB)
3. Upload

**Expected:**

- ✅ Avatar uploaded successfully
- ✅ New avatar displayed

**Test Change Password:**

1. Click "Change Password"
2. Enter current password
3. Enter new password (min 8 chars)
4. Confirm new password
5. Click "Change Password"

**Expected:**

- ✅ Password changed successfully
- ✅ Can login with new password

---

### Test 5: Financial Records (Admin Only)

**Note:** You need ADMIN role for this test.

**Create Record:**

1. Login as admin
2. Go to http://localhost:3000/dashboard/records
3. Click "Add Record"
4. Fill form:
   ```
   Type: Income
   Title: Monthly Salary
   Amount: 5000
   Category: Salary
   Date: Today
   Notes: Test record
   ```
5. Click "Create Record"

**Expected:**

- ✅ Record created successfully
- ✅ Appears in list

**Search Records:**

1. Type "salary" in search box
2. Wait 300ms (debounce)

**Expected:**

- ✅ Search results filtered
- ✅ Only matching records shown

**Filter by Date Range:**

1. Select "From Date": First day of month
2. Select "To Date": Today
3. Records filtered automatically

**Expected:**

- ✅ Only records in date range shown
- ✅ "Clear Dates" button appears

**Edit Record:**

1. Click edit icon on a record
2. Change amount to: 6000
3. Click "Update Record"

**Expected:**

- ✅ Record updated successfully
- ✅ New amount displayed

**Upload Attachment:**

1. Click edit on a record
2. Click "Upload attachment" area
3. Select a file (PDF/Image, max 5MB)
4. Wait for upload

**Expected:**

- ✅ File uploaded successfully
- ✅ "View" link appears
- ✅ Paperclip icon in record list

**Delete Record:**

1. Click delete icon on a record
2. Confirm deletion

**Expected:**

- ✅ Record deleted (soft-delete)
- ✅ Removed from list

---

### Test 6: Dashboard Analytics

**Steps:**

1. Login as any user
2. Go to http://localhost:3000/dashboard
3. View summary cards

**Expected:**

- ✅ Total Income displayed
- ✅ Total Expenses displayed
- ✅ Net Balance calculated
- ✅ Record count shown

**Test Date Range Filter:**

1. Select "From Date"
2. Select "To Date"
3. Dashboard updates automatically

**Expected:**

- ✅ Summary recalculated for date range
- ✅ Charts update
- ✅ "Clear Dates" button appears

---

### Test 7: User Management (Admin Only)

**Steps:**

1. Login as admin
2. Go to http://localhost:3000/dashboard/users
3. View user list

**Expected:**

- ✅ All users displayed
- ✅ Search box available
- ✅ Filter dropdowns available

**Search Users:**

1. Type user name in search
2. Results filter automatically

**Expected:**

- ✅ Matching users shown
- ✅ Non-matching hidden

**Create User:**

1. Click "Add User"
2. Fill form with user details
3. Select role
4. Click "Create User"

**Expected:**

- ✅ User created successfully
- ✅ Appears in list
- ✅ User is pre-verified (no OTP needed)

---

## 🔧 API Testing with Swagger

### 1. Open Swagger UI

Go to: http://localhost:5000/api/docs

### 2. Test Authentication

**Register:**

1. Expand `POST /api/auth/register`
2. Click "Try it out"
3. Enter request body:
   ```json
   {
     "name": "API Test User",
     "email": "apitest@example.com",
     "phone": "+1234567890",
     "password": "Test@12345"
   }
   ```
4. Click "Execute"

**Expected:**

- Status: 201 Created
- Response: Success message

**Verify OTP:**

1. Expand `POST /api/auth/verify-otp`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "identifier": "apitest@example.com",
     "otp": "123456",
     "purpose": "REGISTER"
   }
   ```
4. Click "Execute"

**Expected:**

- Status: 200 OK
- Response: User data + accessToken

**Copy the accessToken for next tests!**

### 3. Test Authenticated Endpoints

**Get Profile:**

1. Expand `GET /api/users/me`
2. Click "Try it out"
3. Click the lock icon 🔒
4. Enter: `Bearer YOUR_ACCESS_TOKEN`
5. Click "Authorize"
6. Click "Execute"

**Expected:**

- Status: 200 OK
- Response: User profile data

---

## 🧪 API Testing with cURL

### Setup

```bash
# Set base URL
BASE_URL="http://localhost:5000/api"

# Register user
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cURL Test User",
    "email": "curltest@example.com",
    "phone": "+1234567890",
    "password": "Test@12345"
  }'

# Verify OTP and get token
TOKEN=$(curl -X POST "$BASE_URL/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "curltest@example.com",
    "otp": "123456",
    "purpose": "REGISTER"
  }' | jq -r '.data.accessToken')

echo "Token: $TOKEN"

# Get profile
curl -X GET "$BASE_URL/users/me" \
  -H "Authorization: Bearer $TOKEN"

# Create record (if admin)
curl -X POST "$BASE_URL/records" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Income",
    "amount": 1000,
    "type": "INCOME",
    "category": "Salary",
    "date": "2026-04-04T00:00:00.000Z",
    "notes": "Test from cURL"
  }'

# List records
curl -X GET "$BASE_URL/records?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Dashboard summary
curl -X GET "$BASE_URL/dashboard/summary" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Testing Checklist

### Frontend Tests

- [ ] Landing page loads
- [ ] Registration works
- [ ] OTP verification works
- [ ] Login works
- [ ] Forgot password works
- [ ] Reset password works
- [ ] Dashboard displays data
- [ ] Records list works
- [ ] Search works (debounced)
- [ ] Date filters work
- [ ] Create record works (admin)
- [ ] Edit record works (admin)
- [ ] Delete record works (admin)
- [ ] Attachment upload works
- [ ] Profile page works
- [ ] Edit profile works
- [ ] Avatar upload works
- [ ] Change password works
- [ ] User management works (admin)
- [ ] Logout works
- [ ] Dark mode toggle works
- [ ] Responsive design works

### Backend Tests

- [ ] Health check responds
- [ ] Registration endpoint works
- [ ] OTP verification works
- [ ] Login endpoint works
- [ ] Refresh token works
- [ ] Logout works
- [ ] Forgot password works
- [ ] Reset password works
- [ ] Get profile works
- [ ] Update profile works
- [ ] Change password works
- [ ] Avatar upload works
- [ ] List records works
- [ ] Create record works
- [ ] Update record works
- [ ] Delete record works
- [ ] Attachment upload works
- [ ] Dashboard summary works
- [ ] Category breakdown works
- [ ] Monthly trends works
- [ ] Search works
- [ ] Date filters work
- [ ] Pagination works
- [ ] Rate limiting works
- [ ] CSRF protection works

### Security Tests

- [ ] Cannot access protected routes without token
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected
- [ ] CSRF token required for mutations
- [ ] Rate limiting triggers after limit
- [ ] OTP lockout after 3 failed attempts
- [ ] Passwords are hashed
- [ ] Refresh tokens rotate
- [ ] httpOnly cookies set
- [ ] CORS blocks unauthorized origins
- [ ] File upload validates type
- [ ] File upload validates size
- [ ] SQL injection prevented
- [ ] XSS prevented

---

## 🐛 Common Issues & Solutions

### Issue: OTP Not Working

**Solution:**
Check that test mode is enabled in `.env`:

```env
OTP_EMAIL_TEST_MODE=true
OTP_SMS_TEST_MODE=true
OTP_TEST_CODE=123456
```

### Issue: Cannot Login

**Solutions:**

1. Check user is verified (OTP completed)
2. Check password is correct
3. Check user status is ACTIVE
4. Check backend logs for errors

### Issue: 401 Unauthorized

**Solutions:**

1. Check token is valid
2. Check token not expired
3. Check Authorization header format: `Bearer TOKEN`
4. Try refreshing token

### Issue: CORS Error

**Solution:**
Check `ALLOWED_ORIGINS` in backend `.env` includes frontend URL:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:80
```

### Issue: File Upload Fails

**Solutions:**

1. Check file size < 5MB
2. Check file type (JPEG, PNG, WebP, PDF)
3. Check Cloudinary credentials configured
4. Check backend logs for errors

---

## 📊 Performance Testing

### Response Time Test

```bash
# Test API response time
time curl http://localhost:5000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: < 200ms
```

### Load Test (Simple)

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test with 100 requests, 10 concurrent
ab -n 100 -c 10 http://localhost:5000/health

# Check results for:
# - Requests per second
# - Time per request
# - Failed requests (should be 0)
```

---

## 🔐 Security Testing

### Test Rate Limiting

```bash
# Try to register 10 times quickly
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test $i\",
      \"email\": \"test$i@example.com\",
      \"phone\": \"+123456789$i\",
      \"password\": \"Test@12345\"
    }"
  echo ""
done

# Expected: After 5 requests, should get 429 Too Many Requests
```

### Test OTP Lockout

```bash
# Try wrong OTP 3 times
for i in {1..3}; do
  curl -X POST http://localhost:5000/api/auth/verify-otp \
    -H "Content-Type: application/json" \
    -d '{
      "identifier": "test@example.com",
      "otp": "000000",
      "purpose": "LOGIN"
    }'
  echo ""
done

# Expected: After 3 attempts, account locked for 30 minutes
```

### Test CSRF Protection

```bash
# Try to make request without CSRF token
curl -X POST http://localhost:5000/api/records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "amount": 100,
    "type": "INCOME",
    "category": "Test",
    "date": "2026-04-04T00:00:00.000Z"
  }'

# Expected: 403 Forbidden (CSRF token missing)
```

---

## 📝 Test Data

### Test Users

After running seed script (`npm run seed` in backend):

| Role    | Email               | Password   | Phone         |
| ------- | ------------------- | ---------- | ------------- |
| Admin   | admin@finance.dev   | Demo@12345 | +919999999999 |
| Analyst | analyst@finance.dev | Demo@12345 | +912222222222 |
| Viewer  | viewer@finance.dev  | Demo@12345 | +913333333333 |

### Test OTP

When test mode is enabled:

- **OTP Code**: `123456`
- Works for all OTP purposes (REGISTER, LOGIN, RESET_PASSWORD)

---

## 🎯 Quick Test Script

Save this as `test.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Finance Dashboard..."

# Test backend health
echo "1. Testing backend health..."
curl -s http://localhost:5000/health | jq

# Test frontend
echo "2. Testing frontend..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

# Test registration
echo "3. Testing registration..."
REGISTER=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test'$(date +%s)'@example.com",
    "phone": "+1234567890",
    "password": "Test@12345"
  }')
echo $REGISTER | jq

# Test OTP verification
echo "4. Testing OTP verification..."
EMAIL=$(echo $REGISTER | jq -r '.data.email // "test@example.com"')
VERIFY=$(curl -s -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "'$EMAIL'",
    "otp": "123456",
    "purpose": "REGISTER"
  }')
echo $VERIFY | jq

# Get token
TOKEN=$(echo $VERIFY | jq -r '.data.accessToken')

if [ "$TOKEN" != "null" ]; then
  echo "✅ Authentication successful!"

  # Test profile
  echo "5. Testing profile..."
  curl -s http://localhost:5000/api/users/me \
    -H "Authorization: Bearer $TOKEN" | jq

  echo "✅ All tests passed!"
else
  echo "❌ Authentication failed!"
fi
```

Run with:

```bash
chmod +x test.sh
./test.sh
```

---

## 🎓 Next Steps

After manual testing:

1. **Write automated tests** (remaining 6%)
   - Auth test coverage
   - Record service tests
   - Dashboard service tests

2. **Set up CI/CD**
   - Automated testing on push
   - Automated deployment

3. **Performance testing**
   - Load testing
   - Stress testing
   - Endurance testing

4. **Security testing**
   - Penetration testing
   - Vulnerability scanning
   - Security audit

---

## 📞 Need Help?

- Check [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)
- Check [TROUBLESHOOTING.md](./DOCKER.md#troubleshooting)
- Check backend logs: `docker-compose logs backend`
- Check frontend logs: `docker-compose logs frontend`

---

**Happy Testing! 🧪**
