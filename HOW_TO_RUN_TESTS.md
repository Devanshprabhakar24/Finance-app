# How to Run Tests

Quick guide to running the automated test suite for the Finance Dashboard application.

---

## Prerequisites

- Node.js 20+ installed
- npm installed
- Backend dependencies installed (`npm install` in backend folder)

---

## Quick Start

### Run All Tests

```bash
cd Finance-app-improved/backend
npm test
```

**Expected Output:**

```
Test Suites: 3 passed, 3 total
Tests:       72 passed, 72 total
Time:        ~41 seconds
```

---

## Test Commands

### Run All Tests with Coverage

```bash
npm test
```

This runs all tests and generates a coverage report.

### Run Specific Test Suite

```bash
# Auth tests only
npm test -- auth.test

# Record service tests only
npm test -- record.service.test

# Dashboard service tests only
npm test -- dashboard.service.test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Tests will re-run automatically when files change.

### Run Tests Without Coverage

```bash
npm test -- --coverage=false
```

Faster execution without coverage reporting.

---

## Test Suites

### 1. Auth Module Tests

**File**: `src/modules/auth/auth.test.ts`  
**Tests**: 4 tests  
**Coverage**: Registration flow with CSRF tokens

**What's Tested:**

- User registration with valid data
- Duplicate email handling
- Invalid phone format validation
- Weak password validation

### 2. Auth Module Expanded Tests

**File**: `src/modules/auth/auth.test.expanded.ts`  
**Tests**: 14 tests  
**Coverage**: Complete authentication flows

**What's Tested:**

- Registration flow
- OTP verification (valid, invalid, expired)
- Brute-force protection (3 attempts lockout)
- Login flow (valid, invalid, suspended users)
- Forgot password
- Reset password
- Resend OTP
- Logout

### 3. Record Service Tests

**File**: `src/modules/records/record.service.test.ts`  
**Tests**: 30 tests  
**Coverage**: Complete CRUD operations

**What's Tested:**

- Create records (income, expense)
- Get all records with filters
- Search and pagination
- Get record by ID
- Update records
- Delete records (soft-delete)
- Upload attachments
- Error handling

### 4. Dashboard Service Tests

**File**: `src/modules/dashboard/dashboard.service.test.ts`  
**Tests**: 38 tests  
**Coverage**: Analytics and reporting

**What's Tested:**

- Dashboard summary calculations
- Category breakdowns
- Monthly trends
- Recent records
- Top expense categories
- Date range filtering
- Edge cases and empty states

---

## Understanding Test Output

### Successful Test Run

```
 PASS  src/dashboard/dashboard.service.test.ts
  Dashboard Service
    getDashboardSummary
      ✓ should return summary with correct totals (404 ms)
      ✓ should return correct record counts (196 ms)
      ...

Test Suites: 3 passed, 3 total
Tests:       72 passed, 72 total
```

### Failed Test

```
 FAIL  src/modules/auth/auth.test.ts
  ● Auth Module › POST /api/auth/register › should register a new user

    expect(received).toBe(expected)

    Expected: 201
    Received: 401

      at Object.<anonymous> (src/modules/auth/auth.test.ts:19:31)
```

### Coverage Report

```
--------|---------|----------|---------|---------|-------------------
File    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------|---------|----------|---------|---------|-------------------
All     |   48.38 |    35.29 |   30.45 |   46.22 |
Dashboard|  79.03 |       48 |      70 |   77.47 |
Records |   71.23 |    68.96 |   31.81 |   68.18 |
```

---

## Test Infrastructure

### In-Memory Database

Tests use `mongodb-memory-server` for:

- Fast execution (no external database needed)
- Isolated tests (each test has clean state)
- No setup required (automatic)

### Test Lifecycle

```javascript
beforeAll(); // Connect to in-memory MongoDB
beforeEach(); // Clean database before each test
afterEach(); // Clean database after each test
afterAll(); // Disconnect from MongoDB
```

### CSRF Token Handling

Auth tests automatically handle CSRF tokens:

```javascript
const csrfToken = await getCsrfToken();
request(app)
  .post("/api/auth/register")
  .set("Cookie", [`csrfToken=${csrfToken}`])
  .set("X-CSRF-Token", csrfToken);
```

---

## Troubleshooting

### Tests Fail with "Cannot connect to MongoDB"

**Solution**: The in-memory MongoDB server will start automatically. If it fails:

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Tests Timeout

**Solution**: Increase Jest timeout in `jest.config.js`:

```javascript
testTimeout: 60000, // 60 seconds
```

### CSRF Token Errors

**Solution**: Make sure you're using the CSRF token helper:

```javascript
const csrfToken = await getCsrfToken();
```

### Port Already in Use

**Solution**: Tests use in-memory database, no ports needed. If you see this error, close any running backend servers:

```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

---

## Coverage Reports

### View HTML Coverage Report

After running tests, open:

```bash
open backend/coverage/index.html
```

### Coverage Thresholds

Current coverage:

- Overall: 48.38% statements
- Dashboard Service: 79.03% statements
- Record Service: 71.23% statements

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "20"
      - run: cd backend && npm install
      - run: cd backend && npm test
      - uses: codecov/codecov-action@v2
        with:
          files: ./backend/coverage/lcov.info
```

---

## Best Practices

### Writing New Tests

1. Follow existing test structure
2. Use descriptive test names
3. Test happy path + error cases
4. Clean up after tests
5. Use proper assertions

### Test Organization

```
describe('Service Name', () => {
  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = ...;

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Common Assertions

```javascript
expect(value).toBe(expected); // Exact equality
expect(value).toBeTruthy(); // Truthy value
expect(value).toBeGreaterThan(0); // Comparison
expect(array).toHaveLength(5); // Array length
expect(object).toHaveProperty("key"); // Object property
expect(fn).toThrow(Error); // Function throws
```

---

## Quick Reference

| Command                        | Description                 |
| ------------------------------ | --------------------------- |
| `npm test`                     | Run all tests with coverage |
| `npm test -- auth.test`        | Run specific test file      |
| `npm run test:watch`           | Watch mode                  |
| `npm test -- --coverage=false` | Skip coverage               |
| `npm test -- --verbose`        | Detailed output             |

---

## Need Help?

- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for manual testing
- Check [TESTING_COMPLETE.md](./TESTING_COMPLETE.md) for test documentation
- Check [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) for verification steps

---

**Happy Testing! 🧪**
