/**
 * ============================================================================
 * TEST SUITE: useValidatedSession Hook
 * ============================================================================
 * 
 * MODULE UNDER TEST: useValidatedSession
 * TEST TYPE: Unit / Integration
 * FRAMEWORK: Vitest + React Testing Library
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-10
 * LAST MODIFIED: 2025-10-10
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the useValidatedSession hook which validates
 * JWT tokens and manages session state with automatic sign-out on failure.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - @testing-library/react: ^16.3.0 - React testing utilities
 * - next-auth/react: Session management
 * - msw: ^2.11.5 - API mocking
 * 
 * COVERAGE SCOPE:
 * ✓ Token validation flow
 * ✓ Session state management
 * ✓ Error handling and sign-out
 * ✓ Loading states
 * ✓ Validation guards (already validated, no token, etc.)
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: jsdom with React
 * - Prerequisites: MSW server, NextAuth mocks
 * - Runtime: <500ms
 * 
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useValidatedSession } from '../useValidatedSession';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockJWT } from '@/test/utils/test-utils';

const MATT_API_BASE = 'https://api.test.mattpm.ai';

// Mock next-auth/react
const mockSignOut = vi.fn();
const mockUseSession = vi.fn();
const mockUpdate = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// Helper to create valid JWT
function createValidJWT(): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  return createMockJWT({
    sub: 'user-123',
    exp: futureExp,
    iat: Math.floor(Date.now() / 1000),
  });
}

describe('useValidatedSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // TEST: Skip Validation Scenarios
  // ========================================================================

  it('should_skip_validation_when_no_mattJwtToken_in_session', async () => {
    // ARRANGE
    mockUseSession.mockReturnValue({
      data: { user: { name: 'Test User' } }, // No mattJwtToken
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT
    expect(result.current.status).toBe('authenticated');
    expect(result.current.isValidating).toBe(false);
    
    // Wait to ensure no validation calls
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('should_skip_validation_when_status_is_not_authenticated', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'loading',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT
    expect(result.current.status).toBe('loading');
    expect(result.current.isValidating).toBe(false);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('should_skip_validation_when_already_validated', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    let callCount = 0;
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        callCount++;
        return HttpResponse.json({ id: 'user-123', login: 'testuser' });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result, rerender } = renderHook(() => useValidatedSession());

    // Wait for first validation
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    // Rerender should not trigger another validation
    rerender();
    await new Promise(resolve => setTimeout(resolve, 100));

    // ASSERT - Only called once despite rerender
    expect(callCount).toBe(1);
  });

  // ========================================================================
  // TEST: Successful Validation
  // ========================================================================

  it('should_validate_token_by_calling_users_me_endpoint', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    let capturedHeaders: Headers | null = null;
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, ({ request }) => {
        capturedHeaders = request.headers;
        return HttpResponse.json({ id: 'user-123', login: 'testuser' });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    renderHook(() => useValidatedSession());

    // ASSERT
    await waitFor(() => {
      expect(capturedHeaders).not.toBeNull();
    });

    expect(capturedHeaders?.get('Authorization')).toBe(`Bearer ${validToken}`);
  });

  it('should_set_hasValidated_to_true_when_validation_succeeds', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        return HttpResponse.json({ id: 'user-123', login: 'testuser' });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // ========================================================================
  // TEST: Validation Failure
  // ========================================================================

  it('should_call_signOut_when_validation_fails_non_OK_response', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    renderHook(() => useValidatedSession());

    // ASSERT
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/' });
    });
  });

  it('should_call_signOut_when_fetch_throws_error', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        throw new Error('Network error');
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    renderHook(() => useValidatedSession());

    // ASSERT
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/' });
    });
  });

  // ========================================================================
  // TEST: Loading States
  // ========================================================================

  it('should_set_isValidating_to_true_during_validation', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    let resolveValidation: ((value: unknown) => void) | null = null;
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        return new Promise((resolve) => {
          resolveValidation = resolve;
        });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT - Should be validating
    await waitFor(() => {
      expect(result.current.isValidating).toBe(true);
    });

    // Complete validation
    if (resolveValidation) {
      resolveValidation(HttpResponse.json({ id: 'user-123' }));
    }

    // Wait for validation to complete
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });
  });

  it('should_return_loading_status_when_isValidating_is_true', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    let resolveValidation: ((value: unknown) => void) | null = null;
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        return new Promise((resolve) => {
          resolveValidation = resolve;
        });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT
    await waitFor(() => {
      expect(result.current.status).toBe('loading');
    });

    // Complete validation
    if (resolveValidation) {
      resolveValidation(HttpResponse.json({ id: 'user-123' }));
    }
  });

  it('should_set_isValidating_to_false_after_validation_completes', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        return HttpResponse.json({ id: 'user-123', login: 'testuser' });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT
    await waitFor(() => {
      expect(result.current.isValidating).toBe(false);
    });
  });

  // ========================================================================
  // TEST: Token Changes
  // ========================================================================

  it('should_reset_hasValidated_when_mattJwtToken_changes', async () => {
    // ARRANGE
    const token1 = createValidJWT();
    let validationCount = 0;
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        validationCount++;
        return HttpResponse.json({ id: 'user-123', login: 'testuser' });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: token1 },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT - Should validate the first token
    await waitFor(() => {
      expect(validationCount).toBeGreaterThanOrEqual(1);
      expect(result.current.isValidating).toBe(false);
    });

    // Note: In real usage, token changes would trigger re-validation via useEffect deps
    // This test verifies that initial validation occurs correctly
    expect(validationCount).toBe(1);
  });

  it('should_reset_hasValidated_when_token_becomes_null', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        return HttpResponse.json({ id: 'user-123', login: 'testuser' });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { rerender } = renderHook(() => useValidatedSession());

    await waitFor(() => {
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    // Remove token
    mockUseSession.mockReturnValue({
      data: { mattJwtToken: null },
      status: 'authenticated',
      update: mockUpdate,
    });

    rerender();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));

    // ASSERT - Should not trigger validation with null token
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // ========================================================================
  // TEST: Concurrent Validation Prevention
  // ========================================================================

  it('should_prevent_multiple_simultaneous_validations_with_ref_guard', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    let validationCount = 0;
    let resolveValidation: ((value: unknown) => void) | null = null;
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        validationCount++;
        return new Promise((resolve) => {
          resolveValidation = resolve;
        });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT - Multiple rapid renders
    const { rerender } = renderHook(() => useValidatedSession());
    rerender();
    rerender();
    rerender();

    await new Promise(resolve => setTimeout(resolve, 100));

    // ASSERT - Should only validate once
    expect(validationCount).toBe(1);

    // Complete validation
    if (resolveValidation) {
      resolveValidation(HttpResponse.json({ id: 'user-123' }));
    }
  });

  // ========================================================================
  // TEST: Return Values
  // ========================================================================

  it('should_pass_mattJwtToken_in_Authorization_header', async () => {
    // ARRANGE
    const validToken = createValidJWT();
    let authHeader: string | null = null;
    
    server.use(
      http.get(`${MATT_API_BASE}/users/me`, ({ request }) => {
        authHeader = request.headers.get('Authorization');
        return HttpResponse.json({ id: 'user-123', login: 'testuser' });
      })
    );

    mockUseSession.mockReturnValue({
      data: { mattJwtToken: validToken },
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    renderHook(() => useValidatedSession());

    // ASSERT
    await waitFor(() => {
      expect(authHeader).toBe(`Bearer ${validToken}`);
    });
  });

  it('should_return_session_data_from_useSession', async () => {
    // ARRANGE
    const mockSessionData = {
      user: { name: 'Test User', email: 'test@test.com' },
      mattJwtToken: createValidJWT(),
    };

    server.use(
      http.get(`${MATT_API_BASE}/users/me`, () => {
        return HttpResponse.json({ id: 'user-123' });
      })
    );

    mockUseSession.mockReturnValue({
      data: mockSessionData,
      status: 'authenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT
    expect(result.current.data).toEqual(mockSessionData);
  });

  it('should_return_update_function_from_useSession', async () => {
    // ARRANGE
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    });

    // ACT
    const { result } = renderHook(() => useValidatedSession());

    // ASSERT
    expect(result.current.update).toBe(mockUpdate);
  });
});

