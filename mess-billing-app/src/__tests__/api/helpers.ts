import request from 'supertest';
import { createServer } from 'http';
import { prisma } from '@/lib/prisma';

/**
 * Supertest API Test Helper
 * Provides utilities for testing Next.js App Router API endpoints
 */

/**
 * Create a test request to a Next.js API route
 * Usage: await testRequest(handler).post('/api/auth/forgot-password').send({...})
 */
export function createApiTestServer() {
  // For Next.js 13+ App Router, we test directly against the route handlers
  // instead of creating an HTTP server
  return request('http://localhost:3000');
}

/**
 * Setup test database (uses .env.test DATABASE_URL)
 */
export async function setupTestDatabase() {
  try {
    // Verify we can connect to test database
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Connected to test database');
    return true;
  } catch (error) {
    console.error('✗ Failed to connect to test database:', error);
    return false;
  }
}

/**
 * Cleanup test database after tests
 */
export async function cleanupTestDatabase() {
  try {
    // Clean up tables in reverse dependency order
    await prisma.messAssignment.deleteMany({});
    await prisma.hostelAssignment.deleteMany({});
    await prisma.feeDeposited.deleteMany({});
    await prisma.monthlyRebate.deleteMany({});
    await prisma.refund.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.mess.deleteMany({});
    await prisma.hostel.deleteMany({});
    await prisma.course.deleteMany({});
    await prisma.session.deleteMany({});
    console.log('✓ Cleaned up test database');
  } catch (error) {
    console.error('✗ Failed to cleanup test database:', error);
  }
}

/**
 * Create test student for use in tests
 */
export async function createTestStudent(overrides?: any) {
  const course = await prisma.course.upsert({
    where: { name: 'B.Tech' },
    update: {},
    create: { name: 'B.Tech' },
  });

  return prisma.student.create({
    data: {
      entryNo: 'TEST001',
      name: 'Test Student',
      email: 'test@example.com',
      phone: '9999999999',
      batch: 2024,
      hostel: 'H1',
      courseId: course.id,
      isBankEditable: true,
      ...overrides,
    },
  });
}

/**
 * Create test admin for use in tests
 */
export async function createTestAdmin() {
  // Admins are managed outside Prisma (next-auth)
  // This is a placeholder for admin authentication tests
  return {
    username: 'admin',
    password: 'Test@12345',
  };
}

/**
 * Helper to make authenticated requests
 */
export async function makeAuthenticatedRequest(
  server: any,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  token?: string
) {
  let req = server[method](path);

  if (token) {
    req = req.set('Authorization', `Bearer ${token}`);
  }

  return req;
}

/**
 * Wait for database synchronization
 */
export async function waitForDatabase(timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return false;
}

export default {
  createApiTestServer,
  setupTestDatabase,
  cleanupTestDatabase,
  createTestStudent,
  createTestAdmin,
  makeAuthenticatedRequest,
  waitForDatabase,
};
