/**
 * ============================================================================
 * TEST UTILITIES
 * ============================================================================
 * 
 * PURPOSE: Custom test utilities and render functions
 * 
 * This file provides:
 * - Custom render function with providers
 * - Mock session provider wrapper
 * - Re-exports of Testing Library utilities
 * - Common test helper functions
 * 
 * ============================================================================
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

/**
 * Mock session data for testing
 */
export const createMockSession = (overrides?: Partial<Session>): Session => {
  return {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@test.com',
      image: 'https://avatar.test/user.png',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    mattJwtToken: 'mock-jwt-token',
    mattUser: {
      id: 'user-123',
      login: 'testuser',
      name: 'Test User',
      avatar_url: 'https://avatar.test/user.png',
      html_url: 'https://github.com/testuser',
    },
    ...overrides,
  };
};

/**
 * Wrapper component that provides session context
 */
interface AllTheProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

function AllTheProviders({ children, session }: AllTheProvidersProps) {
  const mockSession = session !== undefined ? session : createMockSession();
  
  return (
    <SessionProvider session={mockSession}>
      {children}
    </SessionProvider>
  );
}

/**
 * Custom render function that includes providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null;
}

export function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { session, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders session={session}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export our custom render as the default render
export { customRender as render };

/**
 * Create a mock JWT token for testing
 * Uses Buffer for Node.js compatibility with unicode characters
 */
export function createMockJWT(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = 'mock-signature';
  
  return `${header}.${body}.${signature}`;
}

/**
 * Wait for a specific amount of time (for debounce tests, etc.)
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

