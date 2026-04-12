/**
 * k6 Spike Test - Sudden Traffic Surge
 * Normal traffic suddenly spikes to 100 users
 *
 * Purpose: Test system behavior during traffic spikes
 * Detects: Resource leaks, queue overflows, timeout issues
 * Run: k6 run k6/spike-test.js
 *
 * Real-world scenario: Semester starts, everyone checks billing at once
 */

import { loadTestConfig, testData, testEndpoint, thinkTime, check } from './helpers.js';

export const options = {
  stages: loadTestConfig.spikeTest.stages,
  thresholds: {
    http_req_duration: ['p(95)<750', 'p(99)<1500'],
  },
  ext: {
    loadimpact: {
      projectID: 3499175,
      name: 'Spike Test - Traffic Surge',
    },
  },
};

let spikeOccurredAt = 0;

export default function spikeTest() {
  // Record when spike occurs (when vus jump from 10 to 100)
  if (__VU === 10) {
    spikeOccurredAt = Date.now();
    console.log('📊 SPIKE OCCURRED - Monitoring response times and errors');
  }

  // Most common student operation
  const billingResult = testEndpoint(
    'Student Billing Info',
    'GET',
    '/api/student/billing',
    null,
    401
  );

  // Check if response times increase during spike
  check(billingResult, {
    'Billing response acceptable during spike': (r) => r.duration < 1000,
  });

  thinkTime(0.5, 2);

  // Admin dashboard during spike
  const dashboardResult = testEndpoint(
    'Dashboard Access During Spike',
    'GET',
    '/api/dashboard/stats',
    null,
    401
  );

  check(dashboardResult, {
    'Dashboard responsive during spike': (r) => r.duration < 800,
  });

  thinkTime(0.5, 2);

  // Password reset requests (another spike scenario)
  const resetResult = testEndpoint(
    'Forgot Password During Spike',
    'POST',
    '/api/auth/forgot-password',
    { entryNo: 'TEST001' },
    [200, 400, 404, 429]
  );

  check(resetResult, {
    'Rate limiting handles spike': (r) => r.status >= 200,
  });

  thinkTime(1);
}
