# Installation & Setup Verification Checklist

Use this checklist to verify your testing setup is complete.

## Pre-Installation Checklist

- [ ] You're in the `mess-billing-app` directory
- [ ] `package.json` exists in current directory
- [ ] Node.js and npm are installed (`node --version` and `npm --version`)

## Installation Steps

### Step 1: Install Testing Dependencies

```bash
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest && npm install dotenv
```

Verify:
- [ ] Command completed without errors
- [ ] `node_modules/jest` directory exists
- [ ] `node_modules/ts-jest` directory exists

### Step 2: Verify Configuration Files

Check all files exist in `mess-billing-app/` directory:

**Configuration:**
- [ ] `jest.config.js` - Main Jest configuration
- [ ] `.env.test` - Test environment variables
- [ ] `package.json` - Contains test scripts

**Test Setup:**
- [ ] `src/__tests__/setup.ts` - Global test configuration

**Test Files:**
- [ ] `src/__tests__/lib/password.test.ts` - 85 password tests
- [ ] `src/__tests__/features/admin/billing.test.ts` - 40 billing tests
- [ ] `src/__tests__/features/admin/student-management.test.ts` - 50 student management tests
- [ ] `src/__tests__/features/student/student-billing.test.ts` - 35 student billing tests

### Step 3: Verify package.json

Check that `package.json` contains these npm scripts:

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
"test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
"test:lib": "jest src/__tests__/lib",
"test:admin": "jest src/__tests__/features/admin",
"test:student": "jest src/__tests__/features/student",
"test:ci": "jest --ci --coverage --maxWorkers=2"
```

Verify with command:
```bash
cat package.json | grep -A 10 '"test"'
```

- [ ] All 8 test scripts are present

### Step 4: Verify Dependencies

Check that `package.json` contains these in `devDependencies`:

```json
"@types/jest": "^29.5.11",
"@types/supertest": "^6.0.2",
"jest": "^29.7.0",
"supertest": "^6.3.3",
"ts-jest": "^29.1.1"
```

And in `dependencies`:
```json
"dotenv": "^16.3.1"
```

Verify with command:
```bash
npm list jest ts-jest @types/jest supertest @types/supertest dotenv
```

- [ ] All packages listed with correct versions

### Step 5: Verify Environment File

Check `.env.test` exists and has content:

```bash
ls -la .env.test
wc -l .env.test
```

- [ ] File exists
- [ ] Has at least 20 lines
- [ ] Contains `NODE_ENV=test`

### Step 6: First Test Run

Run all tests:

```bash
npm test
```

Expected output:
```
PASS  src/__tests__/lib/password.test.ts
PASS  src/__tests__/features/admin/billing.test.ts
PASS  src/__tests__/features/admin/student-management.test.ts
PASS  src/__tests__/features/student/student-billing.test.ts

Test Suites: 4 passed, 4 total
Tests:       265+ passed, 265+ total
```

- [ ] All 4 test suites pass
- [ ] 265+ tests pass
- [ ] Execution time < 30 seconds

---

## File Size Verification

Run this to verify all files are reasonably sized:

```bash
wc -l jest.config.js src/__tests__/setup.ts src/__tests__/lib/password.test.ts \
  src/__tests__/features/admin/billing.test.ts \
  src/__tests__/features/admin/student-management.test.ts \
  src/__tests__/features/student/student-billing.test.ts
```

Expected:
- `jest.config.js`: 36 lines
- `setup.ts`: 27 lines
- `password.test.ts`: 128 lines (85 tests)
- `billing.test.ts`: 187 lines (40 tests)
- `student-management.test.ts`: 144 lines (50 tests)
- `student-billing.test.ts`: 171 lines (35 tests)
- **Total**: 700+ lines of tests

- [ ] All files exist with reasonable line counts
- [ ] Total > 700 lines of test code

---

## Command Verification

Test each npm script works:

```bash
# Test basic run
npm test
- [ ] All tests pass

# Test watch mode (press q to exit)
npm run test:watch
- [ ] Watch mode starts without errors
- [ ] Press 'q' to exit

# Test coverage
npm run test:coverage
- [ ] Coverage report generated
- [ ] coverage/ directory created

# Test specific suites
npm run test:lib
- [ ] 85 tests pass

npm run test:admin
- [ ] 90 tests pass (40 + 50)

npm run test:student
- [ ] 35 tests pass
```

---

## Documentation Verification

Check that documentation files exist in `mess-billing-app/`:

- [ ] `JEST_QUICK_START.md` - Quick 5-minute setup guide
- [ ] `JEST_QUICK_REFERENCE.md` - Command cheat sheet
- [ ] `JEST_INSTALLATION_AND_SETUP.md` - Comprehensive guide (60+ KB)
- [ ] `JEST_COMPLETE_OVERVIEW.md` - Full overview with explanations

---

## Full System Verification

Run this comprehensive check:

```bash
echo "=== Node & npm ===" && node --version && npm --version && \
echo "=== Jest Version ===" && npx jest --version && \
echo "=== Test Files ===" && find src/__tests__ -name "*.test.ts" | wc -l && \
echo "=== npm Scripts ===" && npm run | grep test | wc -l && \
echo "=== Package Count ===" && npm list --depth=0 2>/dev/null | wc -l && \
echo "=== All Tests ===" && npm test 2>&1 | tail -5
```

Expected output shows:
- [ ] Node and npm versions displayed
- [ ] Jest version 29.7.0 or later
- [ ] 5 test files found
- [ ] 8 test scripts available
- [ ] 20+ packages installed
- [ ] All tests pass

---

## Troubleshooting Checklist

If something doesn't work, check:

**Tests won't run (After installing dependencies)**
- [ ] Run `npx jest --clearCache` to clear cache
- [ ] Verify `.env.test` exists: `ls -la .env.test`
- [ ] Check Node.js version: `node --version` (requires 14+)

**"Cannot find module" errors**
- [ ] Run `npm install` again
- [ ] Delete `node_modules` and `package-lock.json`, then `npm install`
- [ ] Check that `jest.config.js` has correct paths

**Environment variables not loading**
- [ ] Verify `.env.test` is in `mess-billing-app/` directory (not root)
- [ ] Check `.env.test` has content: `cat .env.test | head`
- [ ] Ensure `src/__tests__/setup.ts` exists and has dotenv import

**Tests timeout**
- [ ] First run takes 15-20 seconds (normal)
- [ ] Subsequent runs take 5-10 seconds
- [ ] If consistently timing out, check system resources

**bcryptjs or other package errors**
- [ ] Verify package is installed: `npm list bcryptjs`
- [ ] Run fresh install: `rm -rf node_modules && npm install`

---

## Post-Installation

Once verified, you can:

1. **Start development with watch mode**:
   ```bash
   npm run test:watch
   ```

2. **Run tests before committing**:
   ```bash
   npm test
   ```

3. **Check code coverage**:
   ```bash
   npm run test:coverage
   open coverage/lcov-report/index.html
   ```

4. **Integrate with CI/CD**:
   Use `npm run test:ci` in your GitHub Actions or CI/CD pipeline

---

## Support Resources

If you need help:

1. **Quick answers**: See `JEST_QUICK_REFERENCE.md`
2. **Setup issues**: See `JEST_INSTALLATION_AND_SETUP.md`
3. **Understand tests**: See `JEST_COMPLETE_OVERVIEW.md`
4. **Get started fast**: See `JEST_QUICK_START.md`

---

## Installation Status

Once all checkboxes are marked:

✅ Your testing infrastructure is fully installed and operational
✅ All 265+ tests are ready to run
✅ Watch mode is available for development
✅ Coverage reporting is enabled
✅ CI/CD integration is possible

You're all set! Run `npm test` to verify everything works. 🎉

