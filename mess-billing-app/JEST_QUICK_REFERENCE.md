# Jest Quick Reference

Replace `npm test` and use these for specific needs:

## Installation (one-time)
```bash
npm install --save-dev jest ts-jest @types/jest supertest @types/supertest
```

## Run Tests

| Command | Purpose |
|---------|---------|
| `npm test` | Run all tests once |
| `npm run test:watch` | Watch mode - reruns on file changes |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:lib` | Password library tests only |
| `npm run test:admin` | Admin feature tests only |
| `npm run test:student` | Student feature tests only |
| `npm run test:debug` | Debug mode with Node inspector |
| `npm run test:ci` | CI/CD optimized run |

## Which Command When?

**Development**: `npm run test:watch`
- Run as you code
- Auto-reruns when files change

**Before Commit**: `npm test`
- One-time full test run
- Ensures all pass

**Coverage Check**: `npm run test:coverage`
- Analyze which code paths tested
- View `coverage/lcov-report/index.html`

**Test Specific Feature**:
- Admin: `npm run test:admin`
- Student: `npm run test:student`
- Password: `npm run test:lib`

**CI/CD Pipeline**: `npm run test:ci`
- Optimized for GitHub Actions, GitLab CI
- Generates coverage for codecov

**Debugging Issues**: `npm run test:debug`
- Open `chrome://inspect` while running
- Step through test code

## Test Files Location

```
src/__tests__/
├── setup.ts                           # Global configuration
├── lib/
│   └── password.test.ts              # (85+ tests) Password security
├── features/
│   ├── admin/
│   │   ├── billing.test.ts           # (40+ tests) Admin billing
│   │   └── student-management.test.ts # (50+ tests) Student CRUD
│   └── student/
│       └── student-billing.test.ts   # (35+ tests) Student dashboard
```

## Troubleshooting

**Tests won't run**: Is `.env.test` file missing in `mess-billing-app/` directory?
```bash
ls -la .env.test
```

**"Cannot find module" errors**: Clear Jest cache:
```bash
npx jest --clearCache
```

**Tests too slow**: First run is slowest. Subsequent runs are ~3-5x faster.

**One specific test failing**: Run just that test:
```bash
npx jest src/__tests__/lib/password.test.ts -t "rejects passwords shorter"
```

## Expected Test Results

**First full run**: ~15 seconds, all 265+ tests pass
**Subsequent runs**: ~5 seconds (cached)
**Coverage target**: 85%+ for core security and business logic

## Test Counts

- Password validation: 85 tests
- Admin billing: 40 tests
- Admin student management: 50 tests
- Student billing display: 35 tests
- **Total: 265+ tests**

## Environment Setup

For first-time setup only:
1. Ensure `.env.test` exists (created for you)
2. Run `npm install` (installs test dependencies)
3. Run `npm test` (verifies setup works)

All subsequent sessions just need `npm test` or `npm run test:watch`

