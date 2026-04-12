# Supertest Quick Reference

## Installation (One-time)
Supertest is already installed with Jest setup:
```bash
npm list supertest
```

If needed:
```bash
npm install --save-dev supertest --save-dev @types/supertest
```

---

## Running Tests

| Command | Purpose |
|---------|---------|
| `npm run test:api` | Run all API tests |
| `npx jest src/__tests__/api` | Run all API tests (explicit) |
| `npm run test:watch -- src/__tests__/api` | Watch mode for API tests |
| `npx jest src/__tests__/api/auth.test.ts` | Run auth tests only |
| `npx jest -t "should accept valid"` | Run tests matching pattern |
| `npm run test:coverage -- src/__tests__/api` | Coverage for API tests |

---

## Basic Supertest Pattern

```typescript
import request from 'supertest';

// Simple GET
const response = await request('http://localhost:3000')
  .get('/api/students')
  .expect(200);

// POST with body
const response = await request('http://localhost:3000')
  .post('/api/students')
  .send({ entryNo: 'TEST001', name: 'Test' })
  .expect(201);

// With headers
const response = await request('http://localhost:3000')
  .get('/api/billings')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);

// File upload
const response = await request('http://localhost:3000')
  .post('/api/upload-students')
  .attach('file', '/path/to/file.xlsx')
  .expect(200);

// Multiple status codes accepted
const response = await request('http://localhost:3000')
  .post('/api/students')
  .send({})
  .expect([400, 401]); // Either is OK
```

---

## Common Assertions

```typescript
// Status
expect(response.status).toBe(200);

// Body properties
expect(response.body).toHaveProperty('id');
expect(response.body.message).toContain('success');

// Arrays
expect(Array.isArray(response.body)).toBe(true);
expect(response.body.length).toBeGreaterThan(0);

// Numbers
expect(response.body.total).toBeCloseTo(100.5, 2);

// Strings
expect(response.body.entryNo).toMatch(/^[A-Z0-9]+$/);

// Headers
expect(response.headers['content-type']).toContain('json');
```

---

## Test Files

| File | Tests | Purpose |
|------|-------|---------|
| `auth.test.ts` | 35+ | Password reset, forgot password |
| `admin-students.test.ts` | 30+ | Student CRUD operations |
| `student-billing.test.ts` | 25+ | Billing display, privacy |

---

## Endpoints Tested

### Authentication (`auth.test.ts`)
```
POST /api/auth/forgot-password     - Reset password request
POST /api/auth/reset-password      - Change password
GET  /api/auth/signin              - Sign in page
GET  /api/auth/session             - Current session
```

### Admin Students (`admin-students.test.ts`)
```
GET  /api/admin/students           - List all students
POST /api/admin/students           - Create student
GET  /api/admin/students/:id       - Get one student
```

### Student Billing (`student-billing.test.ts`)
```
GET  /api/student/billing          - Student's billing info
GET  /api/student/:id              - Student's public data
GET  /api/dashboard/stats          - Statistics
GET  /api/dashboard/details        - Dashboard details
```

---

## Troubleshooting

### "Cannot connect to localhost:3000"
- Tests need real API running
- Or mock with Jest mocks
- Or change API_BASE in test file

### Tests timeout
- May need `--runInBand` for sequential runs
- Ensure test database connection works
- Check for hanging requests

### Database changes persist
- Add cleanup in `afterEach()`:
```typescript
afterEach(async () => {
  await prisma.student.deleteMany({});
});
```

### "Supertest not found"
```bash
npm install --save-dev supertest @types/supertest
```

---

## File Structure

```
src/__tests__/
├── api/
│   ├── helpers.ts                  # Utility functions
│   ├── auth.test.ts                # 35 auth tests
│   ├── admin-students.test.ts      # 30 admin tests
│   └── student-billing.test.ts     # 25 student tests
├── lib/                            # Jest unit tests
├── features/                       # Feature tests
└── setup.ts                        # Global setup
```

---

## Test Counts

- Auth: 35 tests
- Admin: 30 tests
- Student: 25 tests
- **Total API: 90+ tests**

---

## Coverage Target

- API endpoints: 70%+ coverage
- Auth flow: 85%+
- Admin operations: 75%+
- Student APIs: 70%+

---

## Run API Tests

```bash
npm run test:api        # All API tests (20s)
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

That's it! Quick reference for common Supertest patterns. 📖

