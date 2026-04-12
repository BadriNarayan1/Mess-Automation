# Jest Quick Start (5 Minutes)

## TL;DR - Get Running Now

```bash
# 1. Install (one time only)
cd mess-billing-app
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest && npm install dotenv

# 2. Verify .env.test exists
ls -la .env.test

# 3. Run tests
npm test

# Expected: All 265+ tests pass ✅
```

Done! Tests are running.

---

## Next Steps

**During development:**
```bash
npm run test:watch
```
Tests auto-rerun when you save files.

**Before committing:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```
Check code coverage to ensure you're testing properly.

**Run specific features:**
```bash
npm run test:admin      # Admin features only
npm run test:student    # Student features only
npm run test:lib        # Password security only
```

---

## What Happens When You Run Tests

```
PASS  src/__tests__/lib/password.test.ts
  Password Validation
    validatePasswordStrength
      ✓ rejects passwords shorter than 12 characters
      ✓ rejects passwords without uppercase
      ✓ accepts valid strong passwords
      ...85 tests total

PASS  src/__tests__/features/admin/billing.test.ts
  Admin - Billing Management
    Fee Calculation and Validation
      ✓ calculates total fees correctly
      ...40 tests total

PASS  src/__tests__/features/admin/student-management.test.ts
  Admin - Student Management
    Student Upload Validation
      ...50 tests total

PASS  src/__tests__/features/student/student-billing.test.ts
  Student - Billing Display
    Billing Information Display
      ...35 tests total

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tests:       265 passed, 265 total
Time:        ~15s (first run), ~5s (subsequent)
```

---

## If Something Breaks

**Problem**: "Cannot find module @/lib/password"
```bash
npx jest --clearCache
npm test
```

**Problem**: "Module not found: dotenv"
```bash
npm install dotenv
npm test
```

**Problem**: ".env.test not found"
The file should exist at: `mess-billing-app/.env.test`
```bash
ls -la .env.test
```

**Problem**: Tests timeout after 30 seconds
These are fast unit tests, shouldn't timeout unless system is under heavy load.

**Problem**: Tests are super slow first time
Normal! First Jest run loads TypeScript compiler. Subsequent runs are 3-5x faster due to caching.

---

## That's It!

You now have:
- ✅ 265+ automated tests
- ✅ Password security testing (85 tests)
- ✅ Admin billing feature testing (40 tests)
- ✅ Admin student management testing (50 tests)
- ✅ Student billing display testing (35 tests)
- ✅ Watch mode for development
- ✅ Coverage reporting
- ✅ CI/CD ready

For more details, read `JEST_INSTALLATION_AND_SETUP.md` or `JEST_QUICK_REFERENCE.md`

