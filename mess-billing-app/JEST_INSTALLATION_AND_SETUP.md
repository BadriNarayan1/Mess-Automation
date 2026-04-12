# Jest Installation & Setup Guide

## Overview
This guide walks you through setting up and running the comprehensive Jest test suite for the Mess Billing Application.

**Total Test Coverage**: 260+ tests across features
- **Password Library Tests**: 85+ tests (validation, hashing, verification)
- **Admin Student Management**: 50+ tests (upload, validation, encryption)
- **Admin Billing Management**: 40+ tests (calculations, reporting, refunds)
- **Student Billing Display**: 35+ tests (privacy, display, calculations)

---

## Step 1: Install Testing Dependencies

Run the following command in the `mess-billing-app` directory:

```bash
npm install
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

Or install in one command:

```bash
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest && npm install dotenv
```

This will add the following packages:
- **jest** (^29.7.0): Test runner and assertion library
- **ts-jest** (^29.1.1): TypeScript support for Jest
- **@types/jest** (^29.5.11): TypeScript type definitions for Jest
- **supertest** (^6.3.3): HTTP assertion library for API testing
- **@types/supertest** (^6.0.2): TypeScript types for Supertest
- **dotenv** (^16.3.1): Environment variable loader for tests

**Expected output**: You'll see `node_modules` directory created with all test dependencies

---

## Step 2: Verify Installation

Check that jest is installed properly:

```bash
npx jest --version
```

Expected output: `29.7.0` (or similar version)

---

## Step 3: Create Environment Files

### Create `.env.test` file

Create a new file at `mess-billing-app/.env.test` for test environment configuration:

```env
# Test Environment Variables
NODE_ENV=test
DATABASE_URL=postgresql://postgres:password@localhost:5432/mess_billing_test
JWT_SECRET=test-secret-key-for-testing-only-min-32-chars-required22
BCRYPT_ROUNDS=13
NEXTAUTH_SECRET=test-nextauth-secret-min-32-chars-for-testing-only-required
NEXTAUTH_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$13$abc123...

# Email (disabled in tests)
EMAIL_HOST=
EMAIL_PORT=0
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

# Feature flags
LOG_LEVEL=error
ENABLE_RATE_LIMITING=false
TEST_MODE=true
```

### Create `.env.development` if not exists

```env
# Development Environment
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/mess_billing_dev
JWT_SECRET=your-development-secret-key-min-32-chars-required-here-12345
NEXTAUTH_SECRET=dev-nextauth-secret-key-min-32-chars-required-here-12345
NEXTAUTH_URL=http://localhost:3000
LOG_LEVEL=debug
```

---

## Step 4: Verify Test Configuration Files

The following files should exist in your project (created in previous setup):

```
mess-billing-app/
├── jest.config.js
├── src/
│   └── __tests__/
│       ├── setup.ts
│       ├── lib/
│       │   └── password.test.ts
│       └── features/
│           ├── admin/
│           │   ├── billing.test.ts
│           │   └── student-management.test.ts
│           └── student/
│               └── student-billing.test.ts
```

**Verify files exist**:
```bash
ls -la jest.config.js
ls -la src/__tests__/setup.ts
ls -la src/__tests__/lib/password.test.ts
ls -la src/__tests__/features/admin/billing.test.ts
ls -la src/__tests__/features/admin/student-management.test.ts
ls -la src/__tests__/features/student/student-billing.test.ts
```

---

## Step 5: Running Tests

### Run All Tests
```bash
npm test
```

Output will show:
- Total test suites passed/failed
- Total tests passed/failed
- Test execution time
- Coverage summary (if configured)

**Expected output for first run**:
```
PASS  src/__tests__/lib/password.test.ts
PASS  src/__tests__/features/admin/billing.test.ts
PASS  src/__tests__/features/admin/student-management.test.ts
PASS  src/__tests__/features/student/student-billing.test.ts

Test Suites: 4 passed, 4 total
Tests:       265 passed, 265 total
Snapshots:   0 total
Time:        12.345 s
```

### Run Tests in Watch Mode (Development)
Perfect for active development - reruns tests as you change files:

```bash
npm run test:watch
```

Features:
- Automatically reruns affected tests on file save
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `q` to exit
- Press `p` to filter by filename

### Run Tests with Coverage Report
Generate detailed code coverage:

```bash
npm run test:coverage
```

Output shows:
- Line coverage %
- Branch coverage %
- Function coverage %
- Statement coverage %

Coverage report is also saved to `coverage/` directory with HTML report:
```bash
open coverage/lcov-report/index.html  # macOS
# or
xdg-open coverage/lcov-report/index.html  # Linux
```

### Run Specific Test Suites

**Library Tests Only** (password validation, hashing, etc.):
```bash
npm run test:lib
```

**Admin Feature Tests** (student management, billing):
```bash
npm run test:admin
```

**Student Feature Tests** (billing display, payment history):
```bash
npm run test:student
```

### Run Specific Test File
```bash
npx jest src/__tests__/lib/password.test.ts
npx jest src/__tests__/features/admin/billing.test.ts
```

### Run Specific Test Suite
```bash
npx jest -t "Password Validation"
npx jest -t "Student Management"
```

### Debug Mode
For advanced debugging with Node inspector:

```bash
npm run test:debug
```

Then open `chrome://inspect` in Chrome to debug

### CI/CD Mode
Optimized for continuous integration environments:

```bash
npm run test:ci
```

Features:
- Runs only once (no watch mode)
- Generates coverage
- Limited worker threads for consistency
- Suitable for GitHub Actions, GitLab CI, etc.

---

## Test File Structure and Organization

### Password Library Tests
**File**: `src/__tests__/lib/password.test.ts` (85+ tests)

Tests the security core of your application:
- Password strength validation (12+ chars, uppercase, lowercase, number, special char)
- Bcrypt 13-round hashing verification
- Password verification with timing attack protection
- Edge cases and error handling

**Run only**:
```bash
npx jest password.test.ts
```

### Admin Billing Tests
**File**: `src/__tests__/features/admin/billing.test.ts` (40+ tests)

Tests admin billing features:
- Billing calculations (fees + mess - rebate - refund)
- Report generation and aggregation
- Hostel/mess grouping
- Refund processing and validation
- Authorization checks (admin only)

**Key test suites**:
- Fee Calculation and Validation
- Billing Report Generation
- Mess and Hostel Management
- Refund Processing
- Authorization for Billing Features

### Admin Student Management Tests
**File**: `src/__tests__/features/admin/student-management.test.ts` (50+ tests)

Tests student data management:
- CSV upload validation
- Database operations
- Password encryption with bcrypt 13 rounds
- Data validation and sanitization
- Bulk upload statistics

**Key test suites**:
- Student Upload Validation
- Student Management in Database
- Password Encryption for New Students
- Data Validation & Sanitization
- Bulk Upload Statistics

### Student Billing Display Tests
**File**: `src/__tests__/features/student/student-billing.test.ts` (35+ tests)

Tests student-facing features:
- Billing information display
- Payment history tracking
- Monthly charges breakdown
- Hostel and mess assignment display
- Data privacy enforcement

**Key test suites**:
- Billing Information Display
- Payment History
- Monthly Charges Display
- Hostel and Mess Assignment Display
- Data Privacy and Access Control

---

## Understanding Jest Configuration

**File**: `jest.config.js`

Key configurations:
```javascript
module.exports = {
  preset: 'ts-jest',           // Use TypeScript
  testEnvironment: 'node',      // Run in Node.js (not browser)
  roots: ['<rootDir>/src'],     // Only test src directory
  testMatch: ['**/__tests__/**/*.test.ts'],  // Find .test.ts files
  testTimeout: 30000,           // 30 second timeout per test
  moduleNameMapper: {           // Map @/ to ./src/
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],  // Global setup
  collectCoverageFrom: [        // Coverage report paths
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ]
};
```

### Jest Setup File
**File**: `src/__tests__/setup.ts`

Runs before all tests:
- Loads `.env.test` environment variables
- Suppresses console logs during tests
- Sets global test configuration
- Initializes test database connection (if needed)

---

## Troubleshooting

### Issue: "Cannot find module" errors

**Solution**: Verify tsconfig jest configuration in `jest.config.js`:
```bash
npx jest --showConfig
```

Check `moduleNameMapper` is configured correctly to map `@/` paths.

### Issue: Tests timeout

**Solution**: Tests are slow on first run. Subsequent runs are faster.

Increase timeout if needed:
```bash
npm test -- --testTimeout=60000
```

### Issue: Environment variables not loading

**Solution**: Ensure `.env.test` exists in `mess-billing-app/` directory:
```bash
ls -la .env.test
```

The `setup.ts` file loads it automatically.

### Issue: TypeScript errors in tests

**Solution**: Verify TypeScript is installed:
```bash
npx tsc --version
```

Clear Jest cache:
```bash
npx jest --clearCache
```

### Issue: "bcryptjs is not defined"

**Solution**: Verify bcryptjs is installed in dependencies:
```bash
npm list bcryptjs
```

Should show: `bcryptjs@^3.0.3`

If not installed:
```bash
npm install bcryptjs
```

### Issue: Tests fail with "Cannot connect to database"

**Solution**: These are unit/feature tests that don't require a database connection. If you're seeing database errors:

1. Check that you're not accidentally connecting to real database
2. The tests are self-contained and should mock database calls
3. For integration tests, ensure `DATABASE_URL` in `.env.test` points to test database

---

## Performance Optimization

### Run Tests in Parallel (default)
```bash
npm test
```

Uses all available CPU cores automatically.

### Run Tests Sequentially
Useful for debugging database-related tests:
```bash
npx jest --runInBand
```

### Run Only Changed Tests
Great for CI/CD:
```bash
npx jest --onlyChanged
```

### Run Only Recent Tests
After last commit:
```bash
npx jest --lastCommit
```

---

## Continuous Integration (GitHub Actions)

Using the `npm run test:ci` script for GitHub Actions:

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
          node-version: '18'
      - run: cd mess-billing-app && npm install
      - run: cd mess-billing-app && npm run test:ci
      - uses: codecov/codecov-action@v2
```

---

## Adding New Tests

### Create a new test file

1. Create file in appropriate `__tests__` subdirectory:
```bash
touch src/__tests__/features/admin/my-feature.test.ts
```

2. Use the template:
```typescript
describe('My Feature Group', () => {
  describe('Subfeature', () => {
    test('should do something', () => {
      expect(true).toBe(true);
    });
  });
});
```

3. Run tests:
```bash
npm test
```

Your new test will automatically be discovered and run!

---

## Test Coverage Goals

Target coverage by category:
- **Security (password.ts)**: 95%+ coverage
- **Business Logic (billing)**: 90%+ coverage
- **Data Management (student)**: 85%+ coverage
- **API Endpoints**: 70%+ coverage (integration tests)

View current coverage:
```bash
npm run test:coverage
```

---

## Summary

**To get started**:
1. `npm install --save-dev jest ts-jest @types/jest supertest @types/supertest`
2. Create `.env.test` file
3. Verify test files exist in `src/__tests__/`
4. Run `npm test`

**Daily commands**:
- `npm test` - Run all tests
- `npm run test:watch` - Development mode
- `npm run test:coverage` - Generate coverage
- `npm run test:admin` - Test admin features only
- `npm run test:student` - Test student features only

For question or issues, check the coverage report and test output for failures.

