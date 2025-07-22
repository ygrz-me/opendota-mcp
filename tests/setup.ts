import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENDOTA_BASE_URL = 'https://api.opendota.com/api';
process.env.OPENDOTA_TIMEOUT = '5000';
process.env.USER_AGENT = 'OpenDota-MCP-Server-Test/1.0.0';

// Global test setup
beforeAll(() => {
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});