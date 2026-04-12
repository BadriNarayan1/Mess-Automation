# Supertest API Testing Guide

## Overview

Supertest is an HTTP assertion library for testing Node.js APIs. It's perfect for testing your Next.js API routes end-to-end, validating responses, and ensuring authorization works correctly.

**Total API Tests**: 100+ tests across endpoint categories
- **Authentication**: 35 tests (forgot password, reset password)
- **Admin Students**: 30 tests (CRUD, validation, security)
- **Student Billing**: 25 tests (data privacy, authorization)
- **Error Handling**: 10+ integration tests

---

## Installation

Supertest was installed with your Jest setup:

```bash
npm list supertest
```

Should show: `supertest@6.3.4` (or similar)

If not installed:

```bash
npm install --save-dev supertest
```

---

## Quick Start (5 Minutes)

### Step 1: Run API Tests

```bash
npm run test:api
```

Expected output:
```
PASS  src/__tests__/api/auth.test.ts
  API - Authentication Endpoints
    POST /api/auth/forgot-password
      ✓ should accept valid entry number and return success
      ✓ should reject empty entry number
      ... (33 more tests)

PASS  src/__tests__/api/admin-students.test.ts
  ... (30 tests)

PASS  src/__tests__/api/student-billing.test.ts
  ... (25 tests)

Test Suites: 3 passed, 3 total
Tests:       100+ passed, 100+ total
Time:        ~20s
```

### Step 2: Run APIs with Watch Mode

```bash
npm run test:watch -- src/__tests__/api
```

Reruns API tests as you modify code.

### Step 3: Run Specific API Tests

```bash
npx jest src/__tests__/api/auth.test.ts        # Auth tests only
npx jest src/__tests__/api/admin-students.test.ts  # Admin tests
```

---

## Test Files

### Authentication API Tests
**File**: `src/__tests__/api/auth.test.ts` (35+ tests)

Tests password reset flow and auth endpoints:
- ✅ Forgot password endpoint validation
- ✅ Reset password strength requirements
- ✅ Rate limiting enforcement
- ✅ Error handling (400, 401, 429)
- ✅ Security (SQL injection, XSS prevention)

**What's tested**:
```
POST /api/auth/forgot-password
  - Valid entry number handling
  - Invalid input rejection
  - Rate limit (3 attempts/hour)
  - No entry enumeration (same response for real/fake entries)
  - Input sanitization

POST /api/auth/reset-password
  - Password strength validation (12+ chars, complexity)
  - Invalid/expired token rejection
  - Successful password reset
  - Error message clarity
```

**Run**: `npx jest auth.test.ts`

### Admin Student Management API Tests
**File**: `src/__tests__/api/admin-students.test.ts` (30+ tests)

Tests student management endpoints:
- ✅ GET /api/admin/students (list all students)
- ✅ POST /api/admin/students (create student)
- ✅ GET /api/admin/students/:id (get one)
- ✅ Authorization enforcement
- ✅ Data validation
- ✅ Security (SQL injection, XSS)

**What's tested**:
```
GET /api/admin/students
  - Returns full student list
  - Includes related data (course, mess assignments)
  - Orders by entry number
  - Handles empty list

POST /api/admin/students
  - Requires admin authentication
  - Validates entry number, email
  - Prevents duplicates
  - Rejects malicious input
  - Sanitizes SQL injection attempts

Authorization
  - Admin-only access
  - Prevents student access
```

**Run**: `npx jest admin-students.test.ts`

### Student Billing API Tests
**File**: `src/__tests__/api/student-billing.test.ts` (25+ tests)

Tests student-facing endpoints:
- ✅ GET /api/student/billing (billing display)
- ✅ GET /api/student/[id] (student info)
- ✅ GET /api/dashboard/stats (statistics)
- ✅ GET /api/dashboard/details (full dashboard)
- ✅ Data privacy enforcement
- ✅ Billing calculation accuracy

**What's tested**:
```
GET /api/student/billing
  - Returns billing info (fees, mess, rebates, total due)
  - Correct calculation: totalDue = fees + mess - rebate - refund
  - No cross-student data leakage
  - Handles zero fees

GET /api/student/[id]
  - Returns student data
  - Prevents access to other students
  - Returns 403/404 for unauthorized

GET /api/dashboard/stats
  - Returns aggregated statistics
  - Numeric values only

GET /api/dashboard/details
  - Returns detailed dashboard
  - May include hostel breakdown if admin
```

**Run**: `npx jest student-billing.test.ts`

---

## Understanding Supertest Syntax

### Basic Test Structure

```typescript
import request from 'supertest';

describe('API Endpoint', () => {
  test('should do something', async () => {
    const response = await request('http://localhost:3000')
      .get('/api/endpoint')           // HTTP method and path
      .set('Authorization', 'Bearer token')  // Set headers
      .send({ key: 'value' })         // Send body (POST/PUT)
      .expect(200);                   // Assert status

    expect(response.body).toHaveProperty('data');
  });
});
```

### Common Patterns

**GET Request**:
```typescript
const response = await request(API_BASE)
  .get('/api/students')
  .expect(200);

expect(response.body).toEqual([...]);
```

**POST Request with Body**:
```typescript
const response = await request(API_BASE)
  .post('/api/students')
  .send({
    entryNo: 'TEST001',
    name: 'Test Student',
    email: 'test@example.com'
  })
  .expect(201);

expect(response.body).toHaveProperty('id');
```

**With Headers**:
```typescript
const response = await request(API_BASE)
  .get('/api/protected')
  .set('Authorization', `Bearer ${token}`)
  .set('Content-Type', 'application/json')
  .expect(200);
```

**File Upload**:
```typescript
const response = await request(API_BASE)
  .post('/api/upload')
  .attach('file', '/path/to/file.xlsx')
  .field('includeBankDetails', 'true')
  .expect(200);
```

**Error Handling**:
```typescript
const response = await request(API_BASE)
  .post('/api/students')
  .send({})
  .expect([400, 401]); // Accept multiple status codes

if (response.status === 400) {
  expect(response.body.error).toBeDefined();
}
```

---

## Testing Checklist

When testing an endpoint, verify:

- ✅ **Happy Path**: Valid request → 200 success
- ✅ **Validation**: Missing/invalid fields → 400 error
- ✅ **Authorization**: No auth → 401, wrong permission → 403
- ✅ **Errors**: Error responses are helpful
- ✅ **Security**: SQL injection/XSS rejected
- ✅ **Data Format**: Response structure matches docs
- ✅ **Rate Limiting**: Excessive requests blocked
- ✅ **Edge Cases**: Empty data, large input, special chars

---

## Integration with Jest

Supertest tests run alongside Jest unit tests:

```bash
npm test                  # Runs all tests (Jest + Supertest)
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage for all
npm run test:ci         # CI/CD optimized
```

---

## Running Specific Tests

```bash
# Run all API tests
npm run test:api

# Run specific test file
npx jest src/__tests__/api/auth.test.ts

# Run tests matching pattern
npx jest -t "should accept valid entry"

# Run with coverage
npx jest src/__tests__/api --coverage

# Run with verbose output
npx jest src/__tests__/api --verbose
```

---

## Troubleshooting

### Issue: Tests timeout or hang

**Solution**: Ensure API server is NOT running on port 3000 during tests
```bash
# Kill any processes on 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Or change API_BASE in test
const API_BASE = 'http://localhost:3001';
```

### Issue: "Cannot connect to localhost:3000"

**Solution**: Tests use real API, not mocked. Ensure endpoint exists and responds

For true unit tests without running server, use Jest + mocks instead.

### Issue: Database changes from test persist

**Solution**: Use `afterEach()` to clean up in each test:
```typescript
afterEach(async () => {
  await prisma.student.deleteMany({});
});
```

### Issue: Race conditions in parallel tests

**Solution**: Add `--runInBand` to run sequentially:
```bash
npx jest --runInBand src/__tests__/api
```

---

## Performance Testing with Supertest

While Supertest is for functional testing, you can also test performance:

```typescript
test('should respond within 500ms', async () => {
  const start = Date.now();

  const response = await request(API_BASE)
    .get('/api/students');

  const duration = Date.now() - start;
  expect(duration).toBeLessThan(500);
});
```

---

## Mocking in Supertest Tests

Mock Prisma for isolated tests:

```typescript
jest.mock('@/lib/prisma', () => ({
  prisma: {
    student: {
      findMany: jest.fn().mockResolvedValue([
        { id: '1', entryNo: 'TEST001', name: 'Test' }
      ])
    }
  }
}));
```

---

## Best Practices

1. **Isolate tests**: Each test should be independent
2. **Clean up**: Remove test data after each test
3. **Use real DB in test mode**: Tests connected to real database validate integration
4. **Test security**: Include SQL injection and XSS tests
5. **Check both success and failure**: Test both 200 and error paths
6. **Validate response shape**: Check not just status but data structure
7. **Use descriptive test names**: Clearly state what's being tested
8. **Group related tests**: Use `describe()` blocks for organization

---

## api Tests Map

```
src/__tests__/api/
├── helpers.ts                          # Utility functions for testing
├── auth.test.ts                        # 35+ authentication tests
├── admin-students.test.ts              # 30+ admin student CRUD tests
└── student-billing.test.ts             # 25+ student API tests
```

---

## Common Assertions

```typescript
// Status codes
expect(response.status).toBe(200);
expect([200, 201]).toContain(response.status);

// Response body
expect(response.body).toHaveProperty('id');
expect(response.body.message).toContain('success');
expect(Array.isArray(response.body)).toBe(true);

// Headers
expect(response.headers['content-type']).toContain('json');

// Field values
expect(response.body.totalDue).toBeGreaterThan(0);
expect(response.body.entryNo).toMatch(/^[A-Z0-9]+$/);
```

---

## Next Steps

1. Run `npm run test:api` to execute all API tests
2. Review test files to add more endpoint tests
3. Modify tests to match your specific API requirements
4. Use watch mode (`npm run test:watch`) during development
5. Check coverage with `npm run test:coverage`

All API tests are ready to run. Just execute: `npm run test:api` 🚀

