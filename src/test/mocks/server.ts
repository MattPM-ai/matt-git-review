/**
 * ============================================================================
 * MSW SERVER SETUP
 * ============================================================================
 * 
 * PURPOSE: Configure and export Mock Service Worker server instance
 * 
 * This server instance is used in the test setup to intercept HTTP requests
 * during tests and return mocked responses.
 * 
 * ============================================================================
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

