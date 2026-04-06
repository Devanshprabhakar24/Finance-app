# Test Credentials - Finance Dashboard

## 🔑 Demo User Accounts

The Finance Dashboard comes with pre-configured test accounts for different user roles. All accounts use the same password for easy testing.

### 🔐 Login Credentials

| Role        | Email                 | Phone           | Password     | OTP (Test Mode) |
| ----------- | --------------------- | --------------- | ------------ | --------------- |
| **Admin**   | `admin@finance.com`   | `+1234567890`   | `admin123`   | `123456`        |
| **Analyst** | `analyst@finance.dev` | `+912222222222` | `Demo@12345` | `123456`        |
| **Viewer**  | `viewer@finance.dev`  | `+913333333333` | `Demo@12345` | `123456`        |

### 📱 Alternative Login Methods

You can login using either **email** or **phone number** as the identifier:

```bash
# Login with email
{
  "identifier": "admin@finance.com",
  "password": "admin123"
}

# Login with phone
{
  "identifier": "+1234567890",
  "password": "admin123"
}
```

## 👥 User Role Permissions

### 🔴 Admin Role

- **Full Access**: Complete system administration
- **User Management**: Create, update, delete users
- **Role Management**: Assign/change user roles
- **Financial Records**: Full CRUD operations on all records
- **Dashboard**: Access to all analytics and reports
- **System Settings**: Configure application settings

**Use Case**: System administrators, business owners

### 🟡 Analyst Role

- **Data Analysis**: Advanced analytics and reporting
- **Financial Records**: Read and create records
- **Dashboard**: Access to detailed analytics
- **Reports**: Generate and export reports
- **Limited User Access**: View user information (no modifications)

**Use Case**: Financial analysts, accountants, managers

### 🟢 Viewer Role

- **Read-Only Access**: View financial data only
- **Personal Records**: View own financial records
- **Basic Dashboard**: Access to personal analytics
- **No Modifications**: Cannot create, update, or delete data

**Use Case**: Regular users, stakeholders with view-only needs

## 🧪 Testing Different Scenarios

### 1. Admin Testing

```bash
# Login as admin
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","password":"admin123"}'

# Verify OTP
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","otp":"123456","purpose":"LOGIN"}'

# Test admin-only endpoints
curl -X GET https://finance-app-ddaf.onrender.com/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 2. Analyst Testing

```bash
# Login as analyst
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"analyst@finance.dev","password":"Demo@12345"}'

# Test analyst permissions
curl -X GET https://finance-app-ddaf.onrender.com/api/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Viewer Testing

```bash
# Login as viewer
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"viewer@finance.dev","password":"Demo@12345"}'

# Test read-only access
curl -X GET https://finance-app-ddaf.onrender.com/api/records \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🌐 Frontend Testing

### Live Application Testing

Visit: https://finance-103y771kv-devansh-prabhakars-projects.vercel.app

1. **Admin Login**:
   - Email: `admin@finance.com`
   - Password: `admin123`
   - OTP: `123456`

2. **Analyst Login**:
   - Email: `analyst@finance.dev`
   - Password: `Demo@12345`
   - OTP: `123456`

3. **Viewer Login**:
   - Email: `viewer@finance.dev`
   - Password: `Demo@12345`
   - OTP: `123456`

### Local Development Testing

If running locally (http://localhost:3000):

1. Start the development server: `npm run dev`
2. Use any of the credentials above
3. OTP will always be `123456` in test mode

## 🔧 Environment Configuration

### Test Mode Settings

The application runs in test mode by default, which means:

```env
# Backend .env settings for testing
OTP_EMAIL_TEST_MODE=true
OTP_SMS_TEST_MODE=true
OTP_TEST_CODE=123456

# This allows any OTP to work in development
```

### Production Mode

In production, set these to `false` for real OTP delivery:

```env
OTP_EMAIL_TEST_MODE=false
OTP_SMS_TEST_MODE=false
# OTP_TEST_CODE is ignored in production
```

## 📊 Sample Data

Each test account comes with pre-populated sample data:

### Admin Account Data

- **Financial Records**: 50+ sample transactions
- **Categories**: Income (Salary, Freelance, Investment) and Expenses (Rent, Food, Transport, etc.)
- **Date Range**: Full year of data
- **Total Income**: ~₹300,000
- **Total Expenses**: ~₹180,000
- **Net Balance**: ~₹120,000

### Analyst Account Data

- **Limited Records**: 20+ sample transactions
- **Focus Areas**: Analysis-relevant data
- **Reports**: Sample analytical data

### Viewer Account Data

- **Personal Records**: 10+ basic transactions
- **Simple Categories**: Basic income/expense tracking
- **Limited Analytics**: Personal dashboard only

## � Creating New Analyst Accounts

### Method 1: Admin Creates Analyst Directly (Recommended)

```bash
# 1. Login as admin
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","password":"admin123"}'

# 2. Verify OTP and get access token
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","otp":"123456","purpose":"LOGIN"}'

# 3. Create analyst user directly
curl -X POST https://finance-app-ddaf.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "New Analyst",
    "email": "new.analyst@company.com",
    "phone": "+1555000001",
    "password": "SecurePassword123",
    "role": "ANALYST"
  }'
```

### Method 2: Self-Registration + Admin Upgrade

```bash
# 1. User registers (gets VIEWER role by default)
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Future Analyst",
    "email": "future.analyst@company.com",
    "phone": "+1555000002",
    "password": "UserPassword123"
  }'

# 2. Admin upgrades user role to ANALYST
curl -X PATCH https://finance-app-ddaf.onrender.com/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{"role": "ANALYST"}'
```

**📋 Complete Account Creation Guide**: [USER-ACCOUNT-CREATION.md](./USER-ACCOUNT-CREATION.md)

## �🚨 Security Notes

### Test Environment Only

- These credentials are for **testing purposes only**
- **Never use these in production**
- Change all passwords and secrets for production deployment

### Password Security

- Test passwords are intentionally simple
- Production passwords should be:
  - At least 12 characters long
  - Include uppercase, lowercase, numbers, and symbols
  - Unique for each user

### OTP Security

- Test mode bypasses real OTP verification
- Production mode requires valid email/SMS delivery
- OTP expires after 10 minutes by default

## 🔄 Resetting Test Data

### Database Reset

```bash
# Reseed the database with fresh test data
cd backend
npm run seed -- --force
```

### Individual Account Reset

If you need to reset a specific account:

1. **Admin Access**: Use admin account to modify other accounts
2. **Database Direct**: Connect to MongoDB and update user records
3. **API Endpoints**: Use admin endpoints to reset user data

## 📞 Support

If you encounter issues with test credentials:

1. **Check Environment**: Ensure test mode is enabled
2. **Verify Database**: Confirm users exist in database
3. **Check Logs**: Review backend logs for authentication errors
4. **Reset Data**: Use seed script to recreate test accounts

---

**🔐 Happy Testing! Use these credentials to explore all features of the Finance Dashboard.**
