/**
 * k6 Endurance Test - Extended Duration
 * Runs for 1 hour with 10 consistent users
 *
 * Purpose: Find long-term stability issues
 * Detects: Memory leaks, database connection issues, gradual degradation
 * Run: k6 run k6/endurance-test.js
 *
 * Real-world scenario: System running all day without restart
 * Watch for: Gradually increasing response times, memory not being freed
 */

import { testData, testEndpoint, thinkTime, check } from './helpers.js';

export const options = {
  stages: [
    { duration: '5m', target: 10 },   // Ramp up
    { duration: '50m', target: 10 },  // Extended duration at 10 VUs
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],
  },
  ext: {
    loadimpact: {
      projectID: 3499175,
      name: 'Endurance Test - Extended Duration',
    },
  },
};

let startTime = Date.now();
let requestCount = 0;
let errorCount = 0;
let slowResponses = 0;
const SLOW_THRESHOLD = 800; // ms

export default function enduranceTest() {
  requestCount++;
  const elapsedMinutes = Math.floor((Date.now() - startTime) / 60000);

  // Rotate through different operations to stress different parts of system
  const operation = requestCount % 5;

  switch (operation) {
    case 0:
      // Student billing (most common - 40%)
      testStudentBilling();
      break;
    case 1:
      // Dashboard (20%)
      testDashboard();
      break;
    case 2:
      // Password reset (20%)
      testPasswordFlow();
      break;
    case 3:
    case 4:
      // Admin operations (20%)
      testAdminOperations();
      break;
  }

  thinkTime(4, 10); // More realistic think time

  // Log metrics every 10 minutes
  if (requestCount % 150 === 0) {
    const errorRate = ((errorCount / requestCount) * 100).toFixed(2);
    const slowRate = ((slowResponses / requestCount) * 100).toFixed(2);
    console.log(
      `⏱️ Endurance Test: ${elapsedMinutes}min | ` +
      `${requestCount} requests | ` +
      `${errorRate}% errors | ` +
      `${slowRate}% slow responses (>${SLOW_THRESHOLD}ms)`
    );
  }
}

function testStudentBilling() {
  const res = testEndpoint(
    'Billing Check',
    'GET',
    '/api/student/billing',
    null,
    401
  );

  if (res.status !== 401) errorCount++;
  if (res.duration > SLOW_THRESHOLD) slowResponses++;

  check(res, {
    'Endurance: Billing responsive': (r) => r.duration < 600,
    'Endurance: No 5xx errors': (r) => r.status < 500,
  });
}

function testDashboard() {
  const res = testEndpoint(
    'Dashboard Stats',
    'GET',
    '/api/dashboard/stats',
    null,
    401
  );

  if (res.status !== 401) errorCount++;
  if (res.duration > SLOW_THRESHOLD) slowResponses++;

  check(res, {
    'Endurance: Dashboard responsive': (r) => r.duration < 700,
  });
}

function testPasswordFlow() {
  const res = testEndpoint(
    'Forgot Password',
    'POST',
    '/api/auth/forgot-password',
    { entryNo: 'TEST001' },
    [200, 400, 404, 429]
  );

  if (![200,400,404,429].includes(res.status)) errorCount++;
  if (res.duration > SLOW_THRESHOLD) slowResponses++;

  check(res, {
    'Endurance: Auth responsive': (r) => r.duration < 500,
  });
}

function testAdminOperations() {
  const res = testEndpoint(
    'Admin Students List',
    'GET',
    '/api/admin/students',
    null,
    401
  );

  if (res.status >= 500) errorCount++;
  if (res.duration > SLOW_THRESHOLD) slowResponses++;

  check(res, {
    'Endurance: Admin ops responsive': (r) => r.duration < 800,
  });
}
