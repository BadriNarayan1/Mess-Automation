/**
 * k6 Smoke Test - Quick Sanity Check
 * Single user, short duration
 *
 * Purpose: Quick validation that system is working
 * Run: k6 run k6/smoke-test.js
 *
 * Use case: Before running load tests, verify system is functioning
 * Should pass in < 1 minute
 */

import { testEndpoint, thinkTime } from './helpers.js';

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(99)<1000'],
  },
};

export default function smokeTest() {
  console.log('🔥 Starting Smoke Test - Quick Sanity Check');

  // Test critical endpoints one by one
  const endpoints = [
    { name: 'Student Billing', method: 'GET', path: '/api/student/billing', expectedStatus: 401 },
    { name: 'Admin Students', method: 'GET', path: '/api/admin/students', expectedStatus: 401 },
    { name: 'Dashboard Stats', method: 'GET', path: '/api/dashboard/stats', expectedStatus: 401 },
    {
      name: 'Forgot Password',
      method: 'POST',
      path: '/api/auth/forgot-password',
      body: { entryNo: 'TEST001' },
      expectedStatus: [200, 400, 404, 429],
    },
    { name: 'Dashboard Details', method: 'GET', path: '/api/dashboard/details', expectedStatus: 401 },
  ];

  for (const endpoint of endpoints) {
    console.log(`✅ Testing: ${endpoint.name}`);

    const result = testEndpoint(
      endpoint.name,
      endpoint.method,
      endpoint.path,
      endpoint.body,
      endpoint.expectedStatus || 200
    );

    if (result.success) {
      console.log(`   ✓ ${endpoint.name} OK (${result.duration}ms)`);
    } else {
      console.error(`   ✗ ${endpoint.name} FAILED (${result.status})`);
    }

    thinkTime(0.5, 1);
  }

  console.log('🎉 Smoke Test Complete');
}
