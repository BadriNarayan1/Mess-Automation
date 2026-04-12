/**
 * k6 Load Test - Baseline Performance Test
 * Gradually increases load from 1 to 20 users over 7 minutes
 *
 * Purpose: Establish baseline performance metrics
 * Run: k6 run k6/load-test.js
 */

import { loadTestConfig, thresholds, testData, testEndpoint, thinkTime } from './helpers.js';

export const options = {
  stages: loadTestConfig.loadTest.stages,
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
  ext: {
    loadimpact: {
      projectID: 3499175,
      name: 'Load Test - Baseline Performance',
    },
  },
};

export default function loadTest() {
  // Simulate student checking billing
  testEndpoint(
    'Get Student Billing',
    'GET',
    '/api/student/billing',
    null,
    401
  );


  thinkTime();

  // Simulate admin viewing students
  testEndpoint(
    'Get Admin Students',
    'GET',
    '/api/admin/students',
    null,
    401
  );

  thinkTime();

  // Simulate password reset request
  testEndpoint(
    'Forgot Password',
    'POST',
    '/api/auth/forgot-password',
    { entryNo: 'TEST001' },
    [200, 400, 404, 429]
  );

  thinkTime();

  // Simulate dashboard access
  testEndpoint(
    'Get Dashboard Stats',
    'GET',
    '/api/dashboard/stats',
    null,
    401
  );

  thinkTime();

  // Simulate detailed dashboard
  testEndpoint(
    'Get Dashboard Details',
    'GET',
    '/api/dashboard/details',
    null,
    401
  );
}
