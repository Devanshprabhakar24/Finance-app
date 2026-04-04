# System Architecture Documentation

This document provides a comprehensive overview of the Finance Dashboard system architecture, design decisions, and implementation details.

---

## Table of Contents

- [Overview](#overview)
- [Architecture Patterns](#architecture-patterns)
- [System Components](#system-components)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Frontend Architecture](#frontend-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Design Decisions](#design-decisions)

---

## Overview

The Finance Dashboard is a full-stack web application built using a modern, scalable architecture. It follows industry best practices and design patterns to ensure maintainability, security, and performance.

### Technology Stack

**Backend:**

- Node.js + Express.js (REST API)
- TypeScript (Type safety)
- MongoDB + Mongoose (Database)
- JWT (Authentication)
- Zod (Validation)

**Frontend:**

- React 18 (UI Library)
- TypeScript (Type safety)
- Vite (Build tool)
- Tailwind CSS (Styling)
- Zustand (State management)
- React Query (Server state)

---

## Architecture Patterns

### 1. Layered Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Routes, Controllers, Middleware)      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│          Business Layer                 │
│     (Services, Business Logic)          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│           Data Layer                    │
│      (Models, Database Access)          │
└─────────────────────────────────────────┘
```

**Benefits:**

- Clear separation of concerns
- Easy to test each layer independently
- Maintainable and scalable
- Follows SOLID principles

### 2. Domain-Driven Design (DDD)

The backend is organized into feature modules (domains):

```
modules/
├── auth/          # Authentication domain
├── users/         # User management domain
└── records/       # Financial records domain
```

Each module contains:

- **Controller**: HTTP request/response handling
- **Service**: Business logic
- **Model**: Data schema and database operations
- **Schema**: Input validation
- **Routes**: Endpoint definitions

**Benefits:**

- Logical grouping of related functionality
- Easy to locate and modify features
- Supports team collaboration
- Scalable for large applications

### 3. Repository Pattern

Services act as repositories, abstracting database operations:

```typescript
// Service layer (repository)
export const createRecord = async (
  data: CreateRecordInput,
): Promise<IFinancialRecord> => {
  return await FinancialRecord.create(data);
};

// Controller uses service
const record = await recordService.createRecord(data, userId);
```

**Benefits:**

- Decouples business logic from data access
- Easy to swap database implementations
- Testable with mocks

### 4. Middleware Pipeline Pattern

Express middleware chain for request processing:

```
Request
  → Security Middleware (helmet, cors)
  → Rate Limiter
  → Authentication
  → Authorization
  → Validation
  → Controller
  → Response
```

**Benefits:**

- Modular request processing
- Reusable middleware
- Clear request flow

---

## System Components

### Backend Components

#### 1. API Gateway (Express App)

```typescript
// app.ts
export const createApp = (): Application => {
  const app = express();

  // Security
  app.use(helmet());
  app.use(cors());
  app.use(mongoSanitize());

  // Parsing
  app.use(express.json());

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/records", recordRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // Error handling
  app.use(errorHandler);

  return app;
};
```

#### 2. Authentication System

**Components:**

- JWT token generation and verification
- OTP generation and validation
- Password hashing (bcrypt)
- Token refresh mechanism

**Flow:**

```
User Login
  → Verify credentials
  → Generate OTP
  → Send OTP (email/SMS)
  → User enters OTP
  → Verify OTP
  → Generate JWT tokens
  → Return tokens to client
```

#### 3. Authorization System (RBAC)

**Middleware:**

```typescript
export const requireRole = (...roles: UserRole[]) => {
  return (req, res, next) => {
    if (!req.user) throw UnauthorizedError;
    if (!roles.includes(req.user.role)) throw ForbiddenError;
    next();
  };
};
```

**Usage:**

```typescript
router.get(
  "/records",
  authenticate,
  requireRole(UserRole.ANALYST, UserRole.ADMIN),
  recordController.getAllRecords,
);
```

#### 4. Validation System

**Zod Schemas:**

```typescript
export const createRecordSchema = z.object({
  title: z.string().min(2).max(100),
  amount: z.number().positive().multipleOf(0.01),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(2).max(50),
  date: z.string().datetime(),
});
```

**Middleware:**

```typescript
export const validateBody = (schema: AnyZodObject) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
```

#### 5. Error Handling System

**Custom Error Classes:**

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400, "VALIDATION_ERROR");
  }
}
```

**Global Error Handler:**

```typescript
export const errorHandler = (err, req, res, next) => {
  logger.error("Error:", err);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.code, undefined, err.statusCode);
  }

  if (err instanceof ZodError) {
    // Handle validation errors
  }

  // Default error
  return sendError(
    res,
    "Internal server error",
    "INTERNAL_ERROR",
    undefined,
    500,
  );
};
```

### Frontend Components

#### 1. State Management

**Zustand Stores:**

```typescript
// auth.store.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

#### 2. Server State Management

**React Query:**

```typescript
// Automatic caching, revalidation, and error handling
const { data, isLoading, error } = useQuery({
  queryKey: ["records", filters],
  queryFn: () => getRecords(filters),
});
```

#### 3. API Layer

**Axios Instance:**

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors, refresh token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      await refreshToken();
      // Retry original request
      return apiClient(error.config);
    }
    return Promise.reject(error);
  },
);
```

---

## Data Flow

### Complete Request Flow Example

**Scenario:** Admin creates a financial record

```
1. USER ACTION
   User fills form and clicks "Create"

2. FRONTEND
   → Form validation (Zod schema)
   → API call: POST /api/records
   → Headers: { Authorization: "Bearer <token>" }
   → Body: { title, amount, type, category, date }

3. BACKEND - EXPRESS APP
   → Security middleware (helmet, cors, sanitization)
   → Rate limiter (check request count)
   → Body parser (parse JSON)

4. BACKEND - ROUTES
   → Match route: POST /api/records
   → Middleware chain:
      a) authenticate
      b) requireRole(ADMIN)
      c) validateBody(createRecordSchema)
      d) recordController.createRecord

5. BACKEND - AUTHENTICATE MIDDLEWARE
   → Extract JWT from Authorization header
   → Verify token signature
   → Decode payload: { userId, email, role }
   → Query database: User.findById(userId)
   → Check user.status === 'ACTIVE'
   → Attach user to req.user
   → next()

6. BACKEND - AUTHORIZE MIDDLEWARE
   → Check req.user.role === 'ADMIN'
   → If not → throw ForbiddenError (403)
   → If yes → next()

7. BACKEND - VALIDATE MIDDLEWARE
   → Parse req.body with Zod schema
   → Validate all fields
   → If invalid → throw ValidationError (400)
   → If valid → next()

8. BACKEND - CONTROLLER
   → Extract validated data from req.body
   → Extract userId from req.user._id
   → Call recordService.createRecord(data, userId)
   → Wrap in asyncHandler (catches errors)

9. BACKEND - SERVICE
   → Business logic:
      const record = await FinancialRecord.create({
        ...data,
        createdBy: userId,
        isDeleted: false
      });
   → Log action: logger.info('Record created')
   → Return record

10. DATABASE
    → Insert document into FinancialRecord collection
    → Auto-generate _id, createdAt, updatedAt
    → Apply indexes
    → Return inserted document

11. BACKEND - RESPONSE
    → sendSuccess(res, 'Record created', record, 201)
    → Format:
       {
         success: true,
         message: "Financial record created successfully",
         data: { _id, title, amount, ... }
       }

12. FRONTEND
    → Receives 201 Created
    → React Query invalidates cache
    → Shows success toast
    → Refreshes records list
    → Updates UI
```

---

## Security Architecture

### 1. Authentication Security

**JWT Token Strategy:**

```
Access Token:
- Expiry: 15 minutes
- Storage: Memory (not localStorage)
- Purpose: API authentication

Refresh Token:
- Expiry: 7 days
- Storage: httpOnly cookie
- Purpose: Renew access token
```

**Why this approach:**

- Access tokens in memory prevent XSS attacks
- Short expiry limits damage if token is compromised
- Refresh tokens in httpOnly cookies prevent JavaScript access
- Automatic token refresh provides seamless UX

### 2. Password Security

```typescript
// Hashing
const passwordHash = await bcrypt.hash(password, 10);

// Verification
const isValid = await bcrypt.compare(password, user.passwordHash);
```

**Requirements:**

- Minimum 8 characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character

### 3. Input Validation

**Multiple layers:**

1. Frontend validation (Zod schemas)
2. Backend validation (Zod schemas)
3. Database validation (Mongoose schemas)

**Protection against:**

- SQL/NoSQL injection
- XSS attacks
- Invalid data types
- Out-of-range values

### 4. Rate Limiting

```typescript
// Global: 100 requests per 15 minutes
// Auth: 10 requests per 15 minutes
// OTP: 5 requests per 15 minutes
```

**Prevents:**

- Brute force attacks
- DDoS attacks
- API abuse

### 5. Security Headers

```typescript
app.use(helmet()); // Sets security headers
app.use(cors()); // CORS configuration
app.use(mongoSanitize()); // NoSQL injection prevention
app.use(hpp()); // HTTP Parameter Pollution prevention
```

---

## Database Design

### Schema Design Principles

1. **Normalization**: Separate concerns (User, Record, OTP)
2. **Indexing**: Optimize query performance
3. **Soft Deletes**: Data recovery capability
4. **Timestamps**: Audit trail
5. **References**: Maintain relationships

### Indexing Strategy

```typescript
// User indexes
{ email: 1, phone: 1 }           // Login lookups (O(log n))
{ status: 1, role: 1 }           // Admin filtering

// FinancialRecord indexes
{ isDeleted: 1, date: -1 }       // Active records by date
{ isDeleted: 1, type: 1, category: 1 }  // Category aggregations
{ createdBy: 1, isDeleted: 1 }   // User-specific queries
{ type: 1, date: -1 }            // Trend analysis
```

**Impact:**

- Query time: O(log n) instead of O(n)
- Aggregations: 10x-100x faster
- Supports millions of records

### Aggregation Pipelines

**Example: Monthly Trends**

```typescript
await FinancialRecord.aggregate([
  // Stage 1: Filter
  {
    $match: {
      isDeleted: false,
      date: { $gte: startDate, $lte: endDate },
    },
  },
  // Stage 2: Group
  {
    $group: {
      _id: {
        year: { $year: "$date" },
        month: { $month: "$date" },
        type: "$type",
      },
      total: { $sum: "$amount" },
    },
  },
  // Stage 3: Sort
  { $sort: { "_id.month": 1 } },
]);
```

**Benefits:**

- Server-side processing (efficient)
- Reduces data transfer
- Optimized by MongoDB

---

## API Design

### RESTful Principles

1. **Resource-based URLs**

   ```
   /api/records          # Collection
   /api/records/:id      # Specific resource
   ```

2. **HTTP Methods**

   ```
   GET    - Retrieve
   POST   - Create
   PATCH  - Partial update
   DELETE - Remove
   ```

3. **Status Codes**

   ```
   200 - OK
   201 - Created
   400 - Bad Request
   401 - Unauthorized
   403 - Forbidden
   404 - Not Found
   500 - Internal Server Error
   ```

4. **Consistent Response Format**
   ```json
   {
     "success": true,
     "message": "Operation successful",
     "data": { ... },
     "meta": { ... }
   }
   ```

### API Versioning (Future)

```
/api/v1/records
/api/v2/records
```

**Benefits:**

- Backward compatibility
- Gradual migration
- Multiple versions support

---

## Frontend Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Sidebar
│   ├── Header
│   └── Main Content
│       ├── DashboardPage
│       ├── RecordsPage
│       ├── UsersPage
│       └── ProfilePage
└── Auth Pages
    ├── LoginPage
    ├── RegisterPage
    └── VerifyOtpPage
```

### State Management Strategy

**Local State (useState):**

- Form inputs
- UI toggles
- Component-specific state

**Global State (Zustand):**

- Authentication state
- UI preferences (theme, sidebar)
- Filter preferences

**Server State (React Query):**

- API data
- Caching
- Automatic revalidation

### Routing Strategy

```typescript
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />

  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/records" element={<RecordsPage />} />
  </Route>

  {/* Admin-only routes */}
  <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
    <Route path="/users" element={<UsersPage />} />
  </Route>
</Routes>
```

---

## Scalability Considerations

### Current Implementation

1. **Stateless Backend**
   - No session storage
   - JWT-based authentication
   - Supports horizontal scaling

2. **Database Indexing**
   - Optimized queries
   - Supports large datasets

3. **Pagination**
   - Prevents loading entire dataset
   - Configurable page size

4. **Caching (React Query)**
   - Reduces API calls
   - Improves performance

### Future Improvements

1. **Redis Caching**

   ```
   Dashboard summary → Cache for 5 minutes
   Category breakdown → Cache for 10 minutes
   Invalidate on record create/update/delete
   ```

2. **Database Sharding**

   ```
   Partition by userId or date range
   Distribute load across multiple servers
   ```

3. **CDN for Static Assets**

   ```
   Serve frontend from CDN
   Reduce server load
   Improve global performance
   ```

4. **Load Balancing**

   ```
   Multiple backend instances
   Distribute traffic
   High availability
   ```

5. **Microservices (Long-term)**
   ```
   Auth Service
   User Service
   Records Service
   Analytics Service
   ```

---

## Design Decisions

### Why MongoDB?

**Pros:**

- Flexible schema (easy to evolve)
- Powerful aggregation framework
- Horizontal scaling support
- JSON-like documents (matches JavaScript)

**Cons:**

- No ACID transactions (not needed for this use case)
- Larger storage footprint

**Decision:** MongoDB is ideal for this application due to flexible schema and powerful aggregations.

### Why JWT?

**Pros:**

- Stateless (no server-side session storage)
- Scalable (works with multiple servers)
- Self-contained (includes user info)

**Cons:**

- Cannot revoke tokens (mitigated with short expiry)
- Larger payload than session IDs

**Decision:** JWT is ideal for stateless, scalable authentication.

### Why Zod?

**Pros:**

- TypeScript-first
- Runtime validation
- Type inference
- Composable schemas

**Cons:**

- Learning curve
- Bundle size

**Decision:** Zod provides type-safe validation with excellent DX.

### Why React Query?

**Pros:**

- Automatic caching
- Background revalidation
- Optimistic updates
- Error handling

**Cons:**

- Additional dependency
- Learning curve

**Decision:** React Query simplifies server state management significantly.

### Why Zustand?

**Pros:**

- Simple API
- Small bundle size
- No boilerplate
- TypeScript support

**Cons:**

- Less ecosystem than Redux

**Decision:** Zustand provides simple, efficient global state management.

---

## Conclusion

This architecture provides a solid foundation for a scalable, maintainable, and secure finance dashboard application. It follows industry best practices and can be extended to support future requirements.

**Key Strengths:**

- Clean separation of concerns
- Type-safe throughout
- Comprehensive security
- Optimized performance
- Scalable design

**Future Enhancements:**

- Redis caching
- Microservices architecture
- Real-time updates (WebSockets)
- Advanced analytics
- Mobile app (React Native)

---

**Last Updated:** January 2025
**Version:** 1.0.0
