/**
 * k6 Stress Test - Push System to Breaking Point
 * Gradually increases load from 50 to 200 users
 *
 * Purpose: Find performance breaking point and stability issues
 * Run: k6 run k6/stress-test.js
 *
 * Expected findings:
 * - Where response times increase dramatically
 * - Where errors start occurring
 * - System breaking point
 */

import { loadTestConfig, thresholds, testData, testEndpoint, thinkTime } from './helpers.js';

export const options = {
  stages: loadTestConfig.stressTest.stages,
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  },
  ext: {
    loadimpact: {
      projectID: 3499175,
      name: 'Stress Test - Breaking Point',
    },
  },
};

export default function stressTest() {
  // Heavy endpoint - student list (admin view)
  testEndpoint(
    'Admin List Students (Heavy)',
    'GET',
    '/api/admin/students',
    null,
    401
  );

  thinkTime(0.5, 1.5);

  // Heavy aggregation - dashboard stats
  testEndpoint(
    'Dashboard Stats (Aggregation)',
    'GET',
    '/api/dashboard/stats',
    null,
    401
  );

  thinkTime(0.5, 1.5);

  // Multiple student billing requests
  const students = ['STUDENT001', 'STUDENT002', 'STUDENT003'];
  students.forEach(studentId => {
    testEndpoint(
      `Get Student ${studentId} Billing`,
      'GET',
      `/api/student/${studentId}`,
      null,
      [401, 403, 404]
    );
    thinkTime(0.3, 0.8);
  });

  // Heavy dashboard details
  testEndpoint(
    'Dashboard Details (Complex)',
    'GET',
    '/api/dashboard/details',
    null,
    401
  );

  thinkTime(0.5, 1);

  // Create student request (admin)
  testEndpoint(
    'Create Student (Write Operation)',
    'POST',
    '/api/admin/students',
    {
      entryNo: `TEST${Date.now()}`,
      name: 'Stress Test Student',
      email: `stress${Date.now()}@test.com`,
      phone: '9999999999',
      batch: 2024,
      hostel: 'H1',
      courseId: '1',
    },
    [400, 401, 403] // May fail under stress or naturally due to unauth
  );

  thinkTime(0.5, 1);

  // Multiple concurrent password resets
  testEndpoint(
    'Forgot Password Request',
    'POST',
    '/api/auth/forgot-password',
    { entryNo: 'TEST001' },
    [200, 400, 404, 429]
  );
}
