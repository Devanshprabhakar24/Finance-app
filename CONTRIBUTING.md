# Contributing to Finance Dashboard

Thank you for your interest in contributing! This document provides guidelines and best practices for contributing to this project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

1. **Fork the repository**

   ```bash
   # Click "Fork" button on GitHub
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/finance-dashboard.git
   cd finance-dashboard
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/finance-dashboard.git
   ```

4. **Install dependencies**

   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

5. **Set up environment variables**

   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your credentials

   # Frontend
   cd ../frontend
   cp .env.example .env
   # Edit .env with your settings
   ```

6. **Run development servers**

   ```bash
   # Backend (terminal 1)
   cd backend
   npm run dev

   # Frontend (terminal 2)
   cd frontend
   npm run dev
   ```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

**Branch Naming Convention:**

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, maintainable code
- Follow the code style guidelines
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Run linter
npm run lint
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add user profile page"
```

See [Commit Message Guidelines](#commit-message-guidelines) below.

### 5. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

- Go to GitHub and create a Pull Request
- Fill in the PR template
- Link related issues
- Request review from maintainers

---

## Code Style Guidelines

### General Principles

1. **SOLID Principles**
   - Single Responsibility
   - Open/Closed
   - Liskov Substitution
   - Interface Segregation
   - Dependency Inversion

2. **DRY (Don't Repeat Yourself)**
   - Extract common logic into utilities
   - Create reusable components/functions

3. **KISS (Keep It Simple, Stupid)**
   - Prefer simple solutions
   - Avoid over-engineering

4. **Clean Code**
   - Meaningful variable names
   - Small, focused functions
   - Clear comments for complex logic

### TypeScript Guidelines

```typescript
// ✅ Good: Explicit types
function calculateTotal(amount: number, tax: number): number {
  return amount + amount * tax;
}

// ❌ Bad: Implicit any
function calculateTotal(amount, tax) {
  return amount + amount * tax;
}

// ✅ Good: Interface for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Enum for constants
enum UserRole {
  ADMIN = "ADMIN",
  ANALYST = "ANALYST",
  VIEWER = "VIEWER",
}

// ✅ Good: Type guards
function isUser(obj: any): obj is User {
  return "id" in obj && "name" in obj && "email" in obj;
}
```

### Backend Code Style

#### 1. File Organization

```typescript
// ✅ Good: Organized imports
import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import * as userService from "./user.service";

// ❌ Bad: Messy imports
import * as userService from "./user.service";
import { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
```

#### 2. Controller Pattern

```typescript
// ✅ Good: Thin controller, delegates to service
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  const user = await userService.createUser(data);
  sendSuccess(res, "User created successfully", user, undefined, 201);
});

// ❌ Bad: Business logic in controller
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User exists" });
    }
    const user = await User.create({ name, email });
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
```

#### 3. Service Pattern

```typescript
// ✅ Good: Pure business logic
export const createUser = async (data: CreateUserInput): Promise<IUser> => {
  // Check if user exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new ConflictError("User already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await User.create({
    ...data,
    passwordHash,
  });

  logger.info(`User created: ${user._id}`);
  return user;
};
```

#### 4. Error Handling

```typescript
// ✅ Good: Custom error classes
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

// Usage
if (!user) {
  throw new NotFoundError("User not found");
}

// ❌ Bad: Generic errors
if (!user) {
  throw new Error("User not found");
}
```

#### 5. Validation

```typescript
// ✅ Good: Zod schemas
export const createUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

// ❌ Bad: Manual validation
if (!name || name.length < 2) {
  throw new Error("Invalid name");
}
```

### Frontend Code Style

#### 1. Component Structure

```typescript
// ✅ Good: Organized component
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '@/api/users.api';
import { UserCard } from '@/components/UserCard';

export function UsersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => getUsers({ search })
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      {data?.map(user => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

#### 2. Custom Hooks

```typescript
// ✅ Good: Reusable hook
export function usePermission() {
  const { user } = useAuthStore();

  const can = (permission: string): boolean => {
    if (!user) return false;
    return PERMISSIONS[user.role].includes(permission);
  };

  return { can };
}

// Usage
const { can } = usePermission();
if (can("create:records")) {
  // Show create button
}
```

#### 3. State Management

```typescript
// ✅ Good: Zustand store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### Naming Conventions

```typescript
// Variables and Functions: camelCase
const userName = "John";
function getUserById(id: string) {}

// Classes and Interfaces: PascalCase
class UserService {}
interface UserData {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = "http://localhost:5000";

// Files: kebab-case
user - service.ts;
auth - controller.ts;
dashboard - page.tsx;

// Components: PascalCase
UserCard.tsx;
LoginForm.tsx;
```

### Comments and Documentation

```typescript
// ✅ Good: JSDoc comments for functions
/**
 * Create a new financial record
 * @param data - Record data
 * @param userId - User ID creating the record
 * @returns Created record
 * @throws {ValidationError} If data is invalid
 * @throws {UnauthorizedError} If user is not authorized
 */
export const createRecord = async (
  data: CreateRecordInput,
  userId: string,
): Promise<IFinancialRecord> => {
  // Implementation
};

// ✅ Good: Inline comments for complex logic
// Calculate percentage with 2 decimal places
const percentage = Math.round((value / total) * 100 * 100) / 100;

// ❌ Bad: Obvious comments
// Set user name
const userName = "John";
```

---

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
feat(auth): add OTP verification

# Bug fix
fix(dashboard): correct net balance calculation

# Documentation
docs(api): update authentication endpoints

# Refactor
refactor(records): extract validation logic to service

# Test
test(users): add unit tests for user service

# Chore
chore(deps): update dependencies
```

### Rules

1. Use present tense ("add" not "added")
2. Don't capitalize first letter
3. No period at the end
4. Keep subject line under 50 characters
5. Separate subject from body with blank line
6. Wrap body at 72 characters
7. Use body to explain what and why, not how

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] Documentation updated
- [ ] Commit messages follow guidelines
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

Describe how you tested your changes

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes
```

### Review Process

1. Maintainer reviews code
2. Automated tests run
3. Feedback provided (if needed)
4. Changes approved
5. PR merged

---

## Testing Guidelines

### Backend Tests

```typescript
// ✅ Good: Descriptive test names
describe("UserService", () => {
  describe("createUser", () => {
    it("should create user with valid data", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Test123!@#",
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it("should throw ConflictError if email exists", async () => {
      // Test implementation
    });
  });
});
```

### Frontend Tests

```typescript
// ✅ Good: Component testing
describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should show error for invalid credentials', async () => {
    // Test implementation
  });
});
```

### Test Coverage

- Aim for 80%+ code coverage
- Focus on critical paths
- Test edge cases
- Test error scenarios

---

## Questions?

If you have questions, please:

1. Check existing documentation
2. Search existing issues
3. Create a new issue with the `question` label

---

**Thank you for contributing!** 🎉
