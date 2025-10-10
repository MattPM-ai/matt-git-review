/**
 * ============================================================================
 * TEST SETUP CONFIGURATION
 * ============================================================================
 * 
 * PURPOSE: Global test setup for Vitest test suite
 * 
 * This file is automatically loaded before any tests run. It configures:
 * - Testing Library matchers (@testing-library/jest-dom)
 * - Mock Service Worker (MSW) for API mocking
 * - Environment variables for tests
 * - Global test utilities and cleanup
 * 
 * ============================================================================
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// Set up environment variables for tests
process.env.NEXT_PUBLIC_GIT_API_HOST = 'https://api.test.mattpm.ai';
process.env.GITHUB_ID = 'test-github-id';
process.env.GITHUB_SECRET = 'test-github-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-nextauth-testing';

// Start MSW server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Clean up MSW server after all tests
afterAll(() => {
  server.close();
});

