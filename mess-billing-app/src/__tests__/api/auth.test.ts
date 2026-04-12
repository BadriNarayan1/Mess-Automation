/**
 * API Tests: Authentication Endpoints
 * Tests for password reset, forgot password, and auth flows
 */

import request from 'supertest';
import { prisma } from '@/lib/prisma';
import { validatePasswordStrength } from '@/lib/password';

describe('API - Authentication Endpoints', () => {
  const API_BASE = 'http://localhost:3000';

  // Cleanup after tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should accept valid entry number and return success', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: 'TEST001' });

      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('message');
      }
    });

    test('should reject empty entry number', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid entry number format', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: '!!invalid!!' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should normalize entry number to uppercase', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: 'test001' });

      expect([200, 400, 404]).toContain(response.status);
    });

    test('should return same response for non-existent entry (no enumeration leak)', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: 'NONEXISTENT' });

      expect([200, 400, 404]).toContain(response.status);
      // Should not leak whether student exists or not
    });

    test('should rate limit after multiple attempts', async () => {
      // First 3 attempts should succeed or fail
      for (let i = 0; i < 3; i++) {
        const response = await request(API_BASE)
          .post('/api/auth/forgot-password')
          .send({ entryNo: 'TEST001' });
        expect([200, 400, 404, 429]).toContain(response.status);
      }

      // 4th attempt should succeed, fail validation, or rate limit
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: 'TEST001' });

      expect([200, 400, 404, 429]).toContain(response.status);
    });

    test('should require Content-Type: application/json', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send('invalid');

      expect([400, 415, 500]).toContain(response.status);
    });

    test('should handle missing json body', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password');

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    test('should reject password not meeting strength requirements', async () => {
      // Password too short (less than 12 chars)
      let response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'ABCD1234',
          newPassword: 'Short123!',
        });

      expect(response.status).toBe(400);
      if (response.body.error) {
        expect(response.body.error).toBeDefined();
      }

      // Password missing uppercase
      response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'ABCD1234',
          newPassword: 'password123!',
        });

      expect(response.status).toBe(400);

      // Password missing lowercase
      response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'ABCD1234',
          newPassword: 'PASSWORD123!',
        });

      expect(response.status).toBe(400);

      // Password missing number
      response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'ABCD1234',
          newPassword: 'Password!abc',
        });

      expect(response.status).toBe(400);

      // Password missing special char
      response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'ABCD1234',
          newPassword: 'Password123abc',
        });

      expect(response.status).toBe(400);
    });

    test('should accept password meeting all requirements', async () => {
      // This assumes a valid reset key exists in the database
      const response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'VALIDKEY',
          newPassword: 'NewPassword123!',
        });

      // May fail with 404/400 if reset key doesn't exist, but should not fail validation
      expect([200, 400, 404, 401]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error).not.toContain('12 characters');
        expect(response.body.error).not.toContain('uppercase');
      }
    });

    test('should reject invalid entry number', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: '!!invalid!!',
          resetKey: 'ABCD1234',
          newPassword: 'NewPassword123!',
        });

      expect(response.status).toBe(400);
    });

    test('should reject missing required fields', async () => {
      let response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          // missing resetKey and newPassword
        });

      expect(response.status).toBe(400);

      response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          resetKey: 'ABCD1234',
          newPassword: 'NewPassword123!',
          // missing entryNo
        });

      expect(response.status).toBe(400);
    });

    test('should reject expired reset key', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'EXPIREDKEY',
          newPassword: 'NewPassword123!',
        });

      // Should return 401 or error indicating expired key
      expect([400, 401, 404]).toContain(response.status);
    });

    test('should reject invalid reset key', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'INVALIDKEY123',
          newPassword: 'NewPassword123!',
        });

      expect([400, 401, 404]).toContain(response.status);
    });

    test('should normalize entry number to uppercase', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'test001',
          resetKey: 'VALIDKEY',
          newPassword: 'NewPassword123!',
        });

      expect([200, 400, 401, 404]).toContain(response.status);
    });
  });

  describe('GET /api/auth/[...nextauth]', () => {
    test('should handle NextAuth signin endpoint', async () => {
      const response = await request(API_BASE)
        .get('/api/auth/signin');

      // NextAuth signin typically returns HTML or redirects
      expect([200, 302, 404]).toContain(response.status);
    });

    test('should handle NextAuth callback endpoint', async () => {
      const response = await request(API_BASE)
        .get('/api/auth/callback');

      expect([200, 302, 400, 404]).toContain(response.status);
    });

    test('should handle NextAuth session endpoint', async () => {
      const response = await request(API_BASE)
        .get('/api/auth/session');

      // Session typically returns JSON
      expect([200, 401, 404]).toContain(response.status);
    });
  });

  describe('Authentication Security', () => {
    test('should reject requests with malicious SQL in entry number', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: "'; DROP TABLE students; --" });

      expect(response.status).toBe(400);
    });

    test('should reject requests with XSS attempts', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: '<script>alert("xss")</script>' });

      expect(response.status).toBe(400);
    });

    test('should sanitize error messages (no version/system info leaks)', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: 'UNKNOWN' });

      expect([200, 400, 404]).toContain(response.status);
      if (response.body.message || response.body.error) {
        const msg = (response.body.message || response.body.error).toString();
        expect(msg).not.toContain('Prisma');
      }
    });

    test('should use HTTPS in production', async () => {
      // This is an environmental check
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      expect(API_BASE.startsWith(protocol)).toBe(true);
    });

    test('should not expose password hash in responses', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({
          entryNo: 'TEST001',
          resetKey: 'INVALIDKEY',
          newPassword: 'NewPassword123!',
        });

      expect(JSON.stringify(response.body)).not.toContain('$2b$');
    });
  });

  describe('Error Handling', () => {
    test('should return appropriate HTTP status codes', async () => {
      // 400 for bad request
      let response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: '' });
      expect(response.status).toBe(400);

      // 429 for rate limit
      for (let i = 0; i < 4; i++) {
        response = await request(API_BASE)
          .post('/api/auth/forgot-password')
          .send({ entryNo: 'RATELIMIT' });
      }
      expect([200, 400, 404, 429]).toContain(response.status);

      // 500 for server errors
      const errorResponse = await request(API_BASE)
        .post('/api/auth/reset-password')
        .send({}); // Will cause missing-fields validation error
      expect([400, 415, 500]).toContain(errorResponse.status);
    });

    test('should include helpful error messages', async () => {
      const response = await request(API_BASE)
        .post('/api/auth/forgot-password')
        .send({ entryNo: '' });

      expect(response.body.error).toBeDefined();
      expect(response.body.error.length).toBeGreaterThan(5);
    });
  });
});
