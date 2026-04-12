import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Suppress console logs during tests (optional)
if (!process.env.DEBUG) {
  global.console.log = jest.fn();
  global.console.debug = jest.fn();
}

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🧪 Starting test suite...');
});

// Global test teardown
afterAll(async () => {
  console.log('✅ Test suite completed');
});
