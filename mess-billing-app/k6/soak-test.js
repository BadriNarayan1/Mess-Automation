/**
 * k6 Soak Test - Long Duration, Low Load
 * Runs for 30 minutes with 20 concurrent users
 *
 * Purpose: Find memory leaks and stability issues
 * Detects: Resource exhaustion over time, database connection leaks
 * Run: k6 run k6/soak-test.js
 *
 * Real-world scenario: System running normally for extended period
 * Watch for: Increasing response times, memory usage, connection pool exhaustion
 */

import { loadTestConfig, testData, testEndpoint, thinkTime, check, group } from './helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 20 },   // Ramp up
    { duration: '26m', target: 20 },  // Stay at 20 VUs for extended period
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
  },
  ext: {
    loadimpact: {
      projectID: 3499175,
      name: 'Soak Test - Long Duration Stability',
    },
  },
};

let requestCount = 0;
let errorCount = 0;

export default function soakTest() {
  requestCount++;

  // Simulate realistic user journey looking for patterns over time
  group('User Journey - Soak Test', () => {
    // Check billing (most common)
    const billingRes = testEndpoint(
      'Billing Check',
      'GET',
      '/api/student/billing',
      null,
      401
    );

    if (billingRes.status !== 401) {
      errorCount++;
      console.warn(`⚠️ Error during billing check at request #${requestCount}: ${billingRes.status}`);
    }

    check(billingRes, {
      'Soak: Billing stays responsive': (r) => r.duration < 500,
      'Soak: No connection issues': (r) => r.status < 500,
    });

    thinkTime(3, 7); // Longer think time for soak test

    // Dashboard
    const dashRes = testEndpoint(
      'Dashboard Check',
      'GET',
      '/api/dashboard/stats',
      null,
      401
    );

    if (dashRes.status !== 401) {
      errorCount++;
    }

    check(dashRes, {
      'Soak: Dashboard stays responsive': (r) => r.duration < 600,
    });

    thinkTime(3, 5);

    // Profile view
    const profileRes = testEndpoint(
      'Profile View',
      'GET',
      '/api/student/STUDENT001',
      null,
      [401, 403, 404]
    );

    thinkTime(2, 5);

    // Occasional admin checks
    if (Math.random() > 0.7) {
      testEndpoint(
        'Admin Student List Check',
        'GET',
        '/api/admin/students',
        null,
        401
      );
    }

    // Log metrics every 50 requests
    if (requestCount % 50 === 0) {
      const errorRate = ((errorCount / requestCount) * 100).toFixed(2);
      console.log(`📈 Soak Test Progress: ${requestCount} requests, ${errorRate}% error rate`);
    }
  });
}
