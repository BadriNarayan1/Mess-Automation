import http from 'k6/http';
import { sleep, check } from 'k6';

// Fuzzing & Security validation script
// Tests how the API responds to unexpected inputs (No 500 status codes expected)
// Usage: k6 run k6/security-fuzz-test.js

export const options = {
  iterations: 1,
  vus: 1,
  thresholds: {
    // We expect security validation to catch these and return 400 Bad Request
    // It should NEVER return a 500 error (unhandled exception).
    'http_req_failed{status:500}': ['rate==0'], 
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Password Reset with SQL Injection Payload
  let res = http.post(`${BASE_URL}/api/auth/forgot-password`, JSON.stringify({
    entryNo: "'; DROP TABLE User; --"
  }), { headers });
  
  check(res, {
    'SQLi does not cause 500': (r) => r.status !== 500,
    'SQLi returns 400 or 404': (r) => r.status === 400 || r.status === 404,
  });

  // 2. Cross-Site Scripting (XSS) Payload
  res = http.post(`${BASE_URL}/api/auth/forgot-password`, JSON.stringify({
    entryNo: "<script>alert('XSS')</script>"
  }), { headers });

  check(res, {
    'XSS does not cause 500': (r) => r.status !== 500,
    'XSS trapped in validation': (r) => r.status >= 400 && r.status < 500,
  });

  // 3. Extremely large payload (Buffer Overflow mitigation test)
  const hugePayload = 'A'.repeat(50000);
  res = http.post(`${BASE_URL}/api/auth/forgot-password`, JSON.stringify({
    entryNo: hugePayload
  }), { headers });

  check(res, {
    large_payload_rejected_cleanly: (r) => r.status === 400 || r.status === 413,
  });

  // 4. Invalid JSON Structure Test
  res = http.post(`${BASE_URL}/api/auth/forgot-password`, '{"entryNo": "2020CSB1001" // Invalid JSON', {
    headers
  });

  check(res, {
    invalid_json_fails_gracefully: (r) => r.status === 400,
  });

  sleep(1);
}
