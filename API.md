# API Documentation - Finance Dashboard

Complete API reference for the Finance Dashboard backend service.

## 📡 Base URL

- **Development**: `http://localhost:8000/api`
- **Production**: `https://finance-app-ddaf.onrender.com/api`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication with an OTP-based login system.

### Authentication Flow

1. **Login** → Receive OTP via email/SMS
2. **Verify OTP** → Receive access & refresh tokens
3. **Use Access Token** → Make authenticated requests
4. **Refresh Token** → Get new access token when expired

### Token Usage

Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## 🔑 Test Credentials

### Demo Accounts (Multiple Roles)

The API provides test accounts for different user roles to demonstrate role-based access control:

| Role        | Email                 | Phone           | Password     | OTP      | Permissions                              |
| ----------- | --------------------- | --------------- | ------------ | -------- | ---------------------------------------- |
| **Admin**   | `admin@finance.com`   | `+1234567890`   | `admin123`   | `123456` | Full system access, user management      |
| **Analyst** | `analyst@finance.dev` | `+912222222222` | `Demo@12345` | `123456` | Data analysis, reporting, create records |
| **Viewer**  | `viewer@finance.dev`  | `+913333333333` | `Demo@12345` | `123456` | Read-only access to personal data        |

### Testing Different Roles

```bash
# Test Admin Access
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","password":"admin123"}'

# Test Analyst Access
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"analyst@finance.dev","password":"Demo@12345"}'

# Test Viewer Access
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"viewer@finance.dev","password":"Demo@12345"}'
```

**📋 Complete Testing Guide**: See [TEST-CREDENTIALS.md](./TEST-CREDENTIALS.md) for detailed role permissions and testing scenarios.

## 📋 API Endpoints

### 🏥 Health & Info

#### GET /health

Check API health status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "message": "Finance Dashboard Backend is running",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600.123
}
```

#### GET /docs

Get API documentation and available endpoints.

**Response:**

```json
{
  "message": "Finance Dashboard API Documentation",
  "version": "1.0.0",
  "endpoints": [...],
  "demoCredentials": {
    "admin": {
      "email": "admin@finance.com",
      "phone": "+1234567890",
      "password": "admin123",
      "otp": "123456"
    },
    "analyst": {
      "email": "analyst@finance.dev",
      "phone": "+912222222222",
      "password": "Demo@12345",
      "otp": "123456"
    },
    "viewer": {
      "email": "viewer@finance.dev",
      "phone": "+913333333333",
      "password": "Demo@12345",
      "otp": "123456"
    }
  }
}
```

### 🔐 Authentication Endpoints

#### POST /auth/login

Initiate login process - sends OTP to user's email and phone.

**Request Body:**

```json
{
  "identifier": "admin@finance.com", // Email or phone number
  "password": "admin123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "OTP sent to your email and phone",
  "data": {
    "identifier": "admin@finance.com",
    "expiresAt": "2024-01-01T12:10:00.000Z"
  }
}
```

**Response (Error):**

```json
{
  "error": "Authentication Failed",
  "message": "Invalid credentials"
}
```

#### POST /auth/register

Register new user - sends OTP for verification.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Registration successful. OTP sent to your email and phone",
  "data": {
    "identifier": "john@example.com",
    "expiresAt": "2024-01-01T12:10:00.000Z"
  }
}
```

#### POST /auth/verify-otp

Verify OTP and complete authentication.

**Request Body:**

```json
{
  "identifier": "admin@finance.com",
  "otp": "123456",
  "purpose": "LOGIN" // or "REGISTER"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "id": "user-123",
      "email": "admin@finance.com",
      "name": "Admin User",
      "role": "admin",
      "phone": "+1234567890"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/resend-otp

Resend OTP to user's email and phone.

**Request Body:**

```json
{
  "identifier": "admin@finance.com",
  "purpose": "LOGIN" // or "REGISTER"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP resent successfully",
  "data": {
    "identifier": "admin@finance.com",
    "expiresAt": "2024-01-01T12:10:00.000Z"
  }
}
```

#### GET /auth/me

Get current user information (requires authentication).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "email": "admin@finance.com",
    "name": "Admin User",
    "role": "admin",
    "phone": "+1234567890"
  }
}
```

#### POST /auth/refresh

Refresh access token using refresh token (sent as httpOnly cookie).

**Response:**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST /auth/logout

Logout user and clear refresh token cookie.

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 💰 Records Endpoints

All records endpoints require authentication.

#### GET /records

Get user's financial records with optional filtering.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

```
?page=1&limit=10&type=income&category=salary&startDate=2024-01-01&endDate=2024-12-31
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "record-123",
      "userId": "user-123",
      "type": "income",
      "amount": 5000,
      "description": "Monthly salary",
      "category": "salary",
      "date": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

#### POST /records

Create new financial record.

**Request Body:**

```json
{
  "type": "expense", // "income" or "expense"
  "amount": 150.5,
  "description": "Grocery shopping",
  "category": "food", // Optional
  "date": "2024-01-01T00:00:00.000Z" // Optional, defaults to now
}
```

**Response:**

```json
{
  "success": true,
  "message": "Record created successfully",
  "data": {
    "id": "record-124",
    "userId": "user-123",
    "type": "expense",
    "amount": 150.5,
    "description": "Grocery shopping",
    "category": "food",
    "date": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T10:30:00.000Z"
  }
}
```

#### GET /records/:id

Get specific record by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "record-123",
    "userId": "user-123",
    "type": "income",
    "amount": 5000,
    "description": "Monthly salary",
    "category": "salary",
    "date": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z"
  }
}
```

#### PUT /records/:id

Update existing record.

**Request Body:**

```json
{
  "amount": 5200,
  "description": "Updated salary amount",
  "category": "salary"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Record updated successfully",
  "data": {
    "id": "record-123",
    "userId": "user-123",
    "type": "income",
    "amount": 5200,
    "description": "Updated salary amount",
    "category": "salary",
    "date": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T11:00:00.000Z"
  }
}
```

#### DELETE /records/:id

Delete record.

**Response:**

```json
{
  "success": true,
  "message": "Record deleted successfully"
}
```

### 📊 Dashboard Endpoints

#### GET /dashboard/stats

Get dashboard statistics and analytics.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalIncome": 15000,
    "totalExpenses": 8500,
    "balance": 6500,
    "totalRecords": 45,
    "categoryBreakdown": {
      "salary": { "income": 15000, "expense": 0 },
      "food": { "income": 0, "expense": 2500 },
      "transport": { "income": 0, "expense": 1200 },
      "entertainment": { "income": 0, "expense": 800 }
    },
    "recentRecords": [
      {
        "id": "record-125",
        "type": "expense",
        "amount": 45.99,
        "description": "Coffee shop",
        "category": "food",
        "date": "2024-01-15T08:30:00.000Z"
      }
    ]
  }
}
```

### 👥 Users Endpoints (Admin Only)

#### GET /users

Get all users (admin only).

**Query Parameters:**

```
?page=1&limit=10&role=user&status=active
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

#### GET /users/:id

Get specific user by ID (admin only).

#### PATCH /users/:id/role

Update user role (admin only).

**Request Body:**

```json
{
  "role": "admin" // "admin", "analyst", or "user"
}
```

#### PATCH /users/:id/status

Update user status (admin only).

**Request Body:**

```json
{
  "status": "inactive" // "active" or "inactive"
}
```

## 🔒 Security Features

### Rate Limiting

- **General**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP
- **OTP endpoints**: 3 requests per 15 minutes per IP

### CSRF Protection

- CSRF tokens required for state-changing operations
- Tokens provided via cookies and validated in headers

### Input Validation

- All inputs validated using Zod schemas
- SQL injection and XSS protection
- File upload restrictions

### CORS Configuration

- Configurable allowed origins
- Credentials support for cookies
- Preflight request handling

## 📝 Error Responses

### Standard Error Format

```json
{
  "error": "Error Type",
  "message": "Human readable error message",
  "code": "ERROR_CODE",           // Optional
  "details": {...}                // Optional additional details
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate resource)
- **422**: Unprocessable Entity (validation failed)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Error Examples

#### Validation Error (400)

```json
{
  "error": "Validation Error",
  "message": "Email and password are required",
  "details": {
    "email": ["Email is required"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

#### Authentication Error (401)

```json
{
  "error": "Unauthorized",
  "message": "Access token is required"
}
```

#### Permission Error (403)

```json
{
  "error": "Forbidden",
  "message": "Admin access required"
}
```

#### Rate Limit Error (429)

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 15 minutes."
}
```

## 🧪 Testing the API

### Using cURL

#### Health Check

```bash
curl https://finance-app-ddaf.onrender.com/api/health
```

#### Login Flow

```bash
# 1. Login (get OTP)
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","password":"admin123"}'

# 2. Verify OTP (get tokens)
curl -X POST https://finance-app-ddaf.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@finance.com","otp":"123456","purpose":"LOGIN"}'

# 3. Use access token
curl -X GET https://finance-app-ddaf.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Create Record

```bash
curl -X POST https://finance-app-ddaf.onrender.com/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "expense",
    "amount": 25.99,
    "description": "Lunch",
    "category": "food"
  }'
```

### Using JavaScript/Fetch

```javascript
// Login and get tokens
async function login() {
  // Step 1: Login
  const loginResponse = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "admin@finance.com",
      password: "admin123",
    }),
  });

  // Step 2: Verify OTP
  const otpResponse = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "admin@finance.com",
      otp: "123456",
      purpose: "LOGIN",
    }),
  });

  const { data } = await otpResponse.json();
  const accessToken = data.accessToken;

  // Step 3: Use token for authenticated requests
  const recordsResponse = await fetch("/api/records", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const records = await recordsResponse.json();
  console.log(records);
}
```

## 📊 Response Formats

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {...}  // Response data
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## 🔧 Development Tools

### Interactive API Documentation

Visit `/api/docs` endpoint for Swagger/OpenAPI documentation with interactive testing.

### Postman Collection

Import the API endpoints into Postman for easy testing:

1. Create new collection
2. Add base URL variable: `{{baseUrl}}`
3. Set up authentication with access token
4. Import endpoints from this documentation

### Environment Variables for Testing

```env
# Development
API_BASE_URL=http://localhost:8000/api

# Production
API_BASE_URL=https://finance-app-ddaf.onrender.com/api

# Test Credentials
TEST_EMAIL=admin@finance.com
TEST_PASSWORD=admin123
TEST_OTP=123456
```

---

**For more information, visit the interactive API documentation at `/api/docs`**
