# User Account Creation Guide - Finance Dashboard

## 🔐 How to Create Analyst and User Accounts

The Finance Dashboard has a role-based system with three user types: **Admin**, **Analyst**, and **Viewer**. Here's how accounts are created for each role.

## 📋 Account Creation Methods

### Method 1: Self-Registration (Default: Viewer Role)

**Default Behavior**: When users register themselves, they get **VIEWER** role by default.

#### Registration Process

1. **User Registration Endpoint**: `POST /api/auth/register`

```bash
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Analyst",
    "email": "john.analyst@company.com",
    "phone": "+1234567890",
    "password": "SecurePassword123"
  }'
```

2. **OTP Verification**: `POST /api/auth/verify-otp`

```bash
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john.analyst@company.com",
    "otp": "123456",
    "purpose": "REGISTER"
  }'
```

**Result**: User account created with **VIEWER** role (needs admin to upgrade to ANALYST).

### Method 2: Admin Creates User Directly (Any Role)

**Admin Privilege**: Admins can create users with any role directly.

#### Admin User Creation

1. **Admin Login** (get access token first)
2. **Create User with Specific Role**: `POST /api/users`

```bash
# Create Analyst user directly
curl -X POST https://finance-app-ddaf.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "name": "Jane Analyst",
    "email": "jane.analyst@company.com",
    "phone": "+1987654321",
    "password": "SecurePassword123",
    "role": "ANALYST"
  }'
```

**Result**: User account created directly with **ANALYST** role (no OTP verification needed).

### Method 3: Admin Upgrades Existing User

**Role Promotion**: Admin can change any user's role after account creation.

#### Upgrade Viewer to Analyst

1. **Find User ID** (admin can list all users)

```bash
curl -X GET https://finance-app-ddaf.onrender.com/api/users \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

2. **Update User Role**: `PATCH /api/users/:id/role`

```bash
curl -X PATCH https://finance-app-ddaf.onrender.com/api/users/USER_ID/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "role": "ANALYST"
  }'
```

**Result**: Existing user promoted from VIEWER to ANALYST role.

## 🎯 Recommended Workflow for Analyst Accounts

### Option A: Admin-Created Accounts (Recommended)

**Best for**: Organizations where admin manages all accounts

1. **Admin logs in** with admin credentials
2. **Admin creates analyst accounts** directly with ANALYST role
3. **Analyst receives credentials** and can login immediately
4. **No role upgrade needed**

### Option B: Self-Registration + Admin Approval

**Best for**: Organizations allowing self-registration with approval process

1. **User registers** themselves (gets VIEWER role)
2. **User requests analyst access** (via email/support)
3. **Admin reviews request** and upgrades role to ANALYST
4. **User gains analyst permissions**

## 📊 Frontend Account Creation

### Admin Dashboard (Web Interface)

If using the frontend application:

1. **Login as Admin**: https://finance-103y771kv-devansh-prabhakars-projects.vercel.app
   - Email: `admin@finance.com`
   - Password: `admin123`
   - OTP: `123456`

2. **Navigate to Users Management** (admin-only section)
3. **Create New User** with desired role
4. **Or upgrade existing user** role

### Registration Page (Self-Registration)

Users can register at: https://finance-103y771kv-devansh-prabhakars-projects.vercel.app/register

- **Default Role**: VIEWER
- **Admin Upgrade Required**: For ANALYST permissions

## 🔧 API Endpoints Summary

### Authentication Endpoints

| Method | Endpoint               | Purpose                         | Role Required |
| ------ | ---------------------- | ------------------------------- | ------------- |
| `POST` | `/api/auth/register`   | Self-registration (VIEWER role) | None          |
| `POST` | `/api/auth/verify-otp` | Complete registration           | None          |
| `POST` | `/api/auth/login`      | Login existing user             | None          |

### User Management Endpoints (Admin Only)

| Method   | Endpoint                | Purpose                   | Role Required |
| -------- | ----------------------- | ------------------------- | ------------- |
| `GET`    | `/api/users`            | List all users            | ADMIN         |
| `POST`   | `/api/users`            | Create user with any role | ADMIN         |
| `GET`    | `/api/users/:id`        | Get user details          | ADMIN         |
| `PATCH`  | `/api/users/:id/role`   | Change user role          | ADMIN         |
| `PATCH`  | `/api/users/:id/status` | Activate/deactivate user  | ADMIN         |
| `DELETE` | `/api/users/:id`        | Soft-delete user          | ADMIN         |

## 👥 User Roles & Permissions

### 🔴 ADMIN

- **Create users** with any role
- **Manage all users** (view, edit, delete)
- **Change user roles** and status
- **Full system access**

### 🟡 ANALYST

- **Advanced analytics** and reporting
- **Create and read** financial records
- **Generate reports** and insights
- **View user information** (read-only)

### 🟢 VIEWER

- **Read-only access** to personal data
- **View own records** and dashboard
- **Basic analytics** for personal use
- **Cannot modify** any data

## 🧪 Testing Account Creation

### Test Admin Account Creation

```bash
# 1. Login as admin
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","password":"admin123"}'

# 2. Verify OTP
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","otp":"123456","purpose":"LOGIN"}'

# 3. Create analyst user
curl -X POST https://finance-app-ddaf.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Test Analyst",
    "email": "test.analyst@example.com",
    "phone": "+1555000001",
    "password": "TestPassword123",
    "role": "ANALYST"
  }'
```

### Test Self-Registration

```bash
# 1. Register new user (gets VIEWER role)
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "phone": "+1555000002",
    "password": "UserPassword123"
  }'

# 2. Verify registration OTP
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "newuser@example.com",
    "otp": "123456",
    "purpose": "REGISTER"
  }'
```

## 🔒 Security Considerations

### Password Requirements

- **Minimum 6 characters** (configurable)
- **Strong passwords recommended** for production
- **Unique passwords** for each user

### OTP Verification

- **Required for self-registration**
- **Not required for admin-created users**
- **10-minute expiration** by default
- **Test mode**: OTP `123456` always works

### Role Security

- **Only admins** can create ANALYST/ADMIN users
- **Role changes** require admin privileges
- **Audit logging** for role changes

## 📞 Support & Troubleshooting

### Common Issues

1. **"Email already registered"**
   - Use different email or reset existing account

2. **"Phone already registered"**
   - Use different phone number or update existing account

3. **"Insufficient permissions"**
   - Ensure admin is logged in for user management

4. **OTP not working**
   - Check test mode settings
   - Verify email/SMS configuration

### Getting Help

- **API Documentation**: [API.md](./API.md)
- **Test Credentials**: [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md)
- **Setup Guide**: [SETUP.md](./SETUP.md)

---

**🎯 Summary**: Analyst accounts can be created by admins directly with ANALYST role, or users can self-register (VIEWER role) and be upgraded by admin to ANALYST role.\*\*
