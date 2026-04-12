/**
 * k6 Load Test - Shared Helpers and Configuration
 * Common utilities for all k6 tests
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';

/**
 * Configuration for different test scenarios
 */
export const loadTestConfig = {
  smokeTest: {
    duration: '1m',
    vus: 1,
  },
  loadTest: {
    stages: [
      { duration: '2m', target: 20 }, // Ramp-up to 20 users
      { duration: '3m', target: 20 }, // Stay at 20 users
      { duration: '2m', target: 0 },  // Ramp-down
    ],
  },
  stressTest: {
    stages: [
      { duration: '2m', target: 50 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 0 },
    ],
  },
  spikeTest: {
    stages: [
      { duration: '1m', target: 10 },
      { duration: '1m', target: 100 }, // Sudden spike
      { duration: '3m', target: 100 },
      { duration: '1m', target: 0 },
    ],
  },
  soakTest: {
    duration: '30m',
    vus: 20,
  },
  enduranceTest: {
    duration: '1h',
    vus: 10,
  },
};

/**
 * Thresholds for test pass/fail criteria
 */
export const thresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
  http_req_failed: ['rate<0.1'],                   // Less than 10% failure rate
  http_reqs: ['rate>100'],                         // At least 100 requests per second
};

/**
 * Common test data
 */
export const testData = {
  baseUrl: 'http://localhost:3000',
  admin: {
    username: 'admin',
    password: 'Test@12345',
  },
  testStudent: {
    entryNo: 'TEST001',
    email: 'test@example.com',
    password: 'TempPassword@123',
  },
};

/**
 * Helper to make HTTP request with standard headers
 */
export function makeRequest(method, url, body = null, headers = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-test',
  };

  const params = {
    headers: { ...defaultHeaders, ...headers },
    timeout: '30s',
  };

  let response;
  switch (method.toUpperCase()) {
    case 'GET':
      response = http.get(url, params);
      break;
    case 'POST':
      response = http.post(url, body ? JSON.stringify(body) : null, params);
      break;
    case 'PUT':
      response = http.put(url, body ? JSON.stringify(body) : null, params);
      break;
    case 'DELETE':
      response = http.del(url, params);
      break;
    default:
      throw new Error(`Unknown HTTP method: ${method}`);
  }

  return response;
}

/**
 * Helper to validate response
 */
export function validateResponse(response, expectedStatus = 200, name = 'Response') {
  const isStatusExpected = (r) => {
    if (Array.isArray(expectedStatus)) return expectedStatus.includes(r.status);
    return r.status === expectedStatus;
  };
  const statusExpectedText = Array.isArray(expectedStatus) 
    ? expectedStatus.join(' or ') 
    : expectedStatus;

  return check(response, {
    [`${name} status is ${statusExpectedText}`]: isStatusExpected,
    [`${name} has content`]: (r) => r.body.length > 0,
    [`${name} headers present`]: (r) => r.headers['Content-Type'] || r.headers['content-type'],
  });
}

/**
 * Helper for API endpoint testing
 */
export function testEndpoint(name, method, path, body = null, expectedStatus = 200) {
  return group(name, () => {
    const url = `${testData.baseUrl}${path}`;
    const response = makeRequest(method, url, body);

    const validated = validateResponse(response, expectedStatus, name);

    return {
      success: validated,
      status: response.status,
      duration: response.timings.duration,
      body: response.body,
    };
  });
}

/**
 * Helper to simulate user think time
 */
export function thinkTime(min = 1, max = 3) {
  sleep(__ENV.THINK_TIME || Math.random() * (max - min) + min);
}

/**
 * Helper to generate random data
 */
export function generateRandomStudent() {
  const num = Math.floor(Math.random() * 10000);
  return {
    entryNo: `TEST${String(num).padStart(4, '0')}`,
    name: `Test Student ${num}`,
    email: `student${num}@test.com`,
    phone: '9999999999',
    batch: 2024,
    hostel: 'H1',
    course: 'B.Tech',
  };
}

/**
 * Helper to simulate realistic user behavior
 */
export function simulateUserJourney(journey) {
  journey.forEach((step, index) => {
    group(`Step ${index + 1}: ${step.name}`, () => {
      const response = makeRequest(step.method, step.url, step.body);
      validateResponse(response, step.expectedStatus, step.name);
      thinkTime();
    });
  });
}

export default {
  loadTestConfig,
  thresholds,
  testData,
  makeRequest,
  validateResponse,
  testEndpoint,
  thinkTime,
  generateRandomStudent,
  simulateUserJourney,
};
