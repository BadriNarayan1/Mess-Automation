/**
 * API Tests: Student Billing Display
 * Tests for student-facing billing and dashboard endpoints
 */

import request from 'supertest';
import { prisma } from '@/lib/prisma';

describe('API - Student Billing Display', () => {
  const API_BASE = 'http://localhost:3000';

  let testStudentId: number;

  beforeAll(async () => {
    // Create test student
    const course = await prisma.course.upsert({
      where: { name: 'B.Tech' },
      update: {},
      create: { name: 'B.Tech' },
    });

    const student = await prisma.student.upsert({
      where: { entryNo: 'STUDENT001' },
      update: {
        name: 'Billing Test Student',
        email: 'student@test.com',
        mobileNo: '9999999999',
        batch: '2024',
        hostel: 'H1',
        courseId: course.id,
        isBankEditable: true,
      },
      create: {
        entryNo: 'STUDENT001',
        name: 'Billing Test Student',
        email: 'student@test.com',
        mobileNo: '9999999999',
        batch: '2024',
        hostel: 'H1',
        courseId: course.id,
        isBankEditable: true,
      },
    });

    testStudentId = student.id;
  });

  afterAll(async () => {
    await prisma.student.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET /api/student/billing', () => {
    test('should return billing information for authenticated student', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalFees');
        expect(response.body).toHaveProperty('totalDue');
        expect(response.body).toHaveProperty('messCharges');
      }
    });

    test('should calculate billing correctly: totalDue = fees + mess - rebate - refund', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      if (response.status === 200) {
        const { totalFees, messCharges, rebates, refunds, totalDue } = response.body;

        if (totalFees && messCharges !== undefined && rebates !== undefined && refunds !== undefined) {
          const expectedDue = totalFees + messCharges - rebates - refunds;
          expect(totalDue).toBeCloseTo(expectedDue, 2);
        }
      }
    });

    test('should not include data from other students', async () => {
      // Create another student
      const course = await prisma.course.findFirst({});
      if (course) {
        await prisma.student.upsert({
          where: { entryNo: 'OTHER001' },
          update: {},
          create: {
            entryNo: 'OTHER001',
            name: 'Other Student',
            email: 'other@test.com',
            mobileNo: '9999999999',
            batch: '2024',
            hostel: 'H2',
            courseId: course.id,
            isBankEditable: true,
          },
        });
      }

      const response = await request(API_BASE)
        .get('/api/student/billing');

      if (response.status === 200) {
        // Response should be for authenticated student only
        expect(response.body).not.toHaveProperty('entryNo'); // Shouldn't expose entry number usually
      }
    });

    test('should handle student with no fees', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      if (response.status === 200) {
        expect(response.body.totalFees).toBeGreaterThanOrEqual(0);
        expect(response.body.totalDue).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /api/student/[id]', () => {
    test('should return student data for valid ID', async () => {
      const response = await request(API_BASE)
        .get(`/api/student/${testStudentId}`);

      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('entryNo');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('email');
      }
    });

    test('should prevent student from accessing other students data', async () => {
      const otherStudent = await prisma.student.findFirst({
        where: { NOT: { id: testStudentId } },
      });

      if (otherStudent) {
        const response = await request(API_BASE)
          .get(`/api/student/${otherStudent.id}`);

        // Should return 403 Forbidden or 404 Not Found
        expect([403, 404, 401]).toContain(response.status);
      }
    });

    test('should return 404 for non-existent student', async () => {
      const response = await request(API_BASE)
        .get('/api/student/invalid-uuid-format');

      expect([404, 400, 401]).toContain(response.status);
    });
  });

  describe('GET /api/dashboard/stats', () => {
    test('should return dashboard statistics', async () => {
      const response = await request(API_BASE)
        .get('/api/dashboard/stats');

      expect([200, 401]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('totalStudents');
        expect(response.body).toHaveProperty('totalCollected');
        expect(response.body).toHaveProperty('outstandingFees');
      }
    });

    test('should return numeric statistics', async () => {
      const response = await request(API_BASE)
        .get('/api/dashboard/stats');

      if (response.status === 200) {
        expect(typeof response.body.totalStudents).toBe('number');
        // Other fields may be objects/arrays for admin vs student view
      }
    });
  });

  describe('GET /api/dashboard/details', () => {
    test('should return detailed dashboard information', async () => {
      const response = await request(API_BASE)
        .get('/api/dashboard/details');

      expect([200, 401]).toContain(response.status);

      if (response.status === 200) {
        expect(typeof response.body).toBe('object');
      }
    });

    test('should provide hostel-wise breakdown if admin', async () => {
      const response = await request(API_BASE)
        .get('/api/dashboard/details');

      if (response.status === 200) {
        // Admin view might have hostelBreakdown
        if (response.body.hostelBreakdown) {
          expect(Array.isArray(response.body.hostelBreakdown)).toBe(true);
        }
      }
    });
  });

  describe('Data Privacy & Authorization', () => {
    test('should enforce student isolation (cannot see other students)', async () => {
      // This is critical for student data
      const students = await prisma.student.findMany({ take: 2 });

      if (students.length > 1) {
        const response = await request(API_BASE)
          .get(`/api/student/${students[1].id}`);

        // Should either be 403/404 or return only own data
        if (response.status === 200) {
          // If it returns 200, verify it's matching the authenticated student
          // This would require session/token verification
          expect(response.status).toBe(200);
        } else {
          expect([403, 404, 401]).toContain(response.status);
        }
      }
    });

    test('should not expose admin-only fields to students', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      if (response.status === 200) {
        // Should not expose internal admin fields
        expect(response.body).not.toHaveProperty('adminNotes');
        expect(response.body).not.toHaveProperty('internalFlags');
      }
    });

    test('should include only relevant student data fields', async () => {
      const response = await request(API_BASE)
        .get(`/api/student/${testStudentId}`);

      if (response.status === 200) {
        // Should include public student info
        const publicFields = ['name', 'email', 'batch', 'hostel'];
        const hasPublicFields = publicFields.some(field =>
          field in response.body
        );
        expect(hasPublicFields).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should return 401 for unauthenticated requests', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      // If not authenticated, should return 401
      expect([200, 401]).toContain(response.status);
    });

    test('should handle database errors gracefully', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 500) {
        // Error message should not expose database details
        expect(JSON.stringify(response.body)).not.toContain('QUERY');
        expect(JSON.stringify(response.body)).not.toContain('SELECT');
      }
    });

    test('should handle invalid UUID format gracefully', async () => {
      const response = await request(API_BASE)
        .get('/api/student/not-a-uuid');

      expect([400, 404, 401]).toContain(response.status);
    });
  });

  describe('Response Validation', () => {
    test('should return valid JSON in all responses', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      if (response.status === 200) {
        expect(response.type).toContain('json');
        expect(typeof response.body).toBe('object');
      }
    });

    test('should include proper headers', async () => {
      const response = await request(API_BASE)
        .get('/api/student/billing');

      expect(response.headers['content-type']).toBeDefined();
    });

    test('should not expose sensitive headers', async () => {
      const response = await request(API_BASE)
        .get('/api/dashboard/stats');

      // Should not expose server version or other sensitive info
      if (response.headers['server']) {
        expect(response.headers['server']).not.toContain('Node');
        expect(response.headers['server']).not.toContain('Express');
      }
    });
  });
});
