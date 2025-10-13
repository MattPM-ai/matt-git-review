/**
 * ============================================================================
 * TEST SUITE: useQueryAuth Hook
 * ============================================================================
 * 
 * MODULE UNDER TEST: useQueryAuth
 * TEST TYPE: Unit / Integration
 * FRAMEWORK: Vitest + React Testing Library
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-13
 * LAST MODIFIED: 2025-10-13
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the useQueryAuth hook which handles
 * authentication via query parameters, sessionStorage persistence,
 * and organization access validation with redirect capabilities.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - @testing-library/react: ^16.3.0 - React testing utilities
 * - useQueryAuth: Target hook with query auth state management
 * 
 * COVERAGE SCOPE:
 * ✓ Query parameter extraction and validation
 * ✓ sessionStorage persistence and retrieval
 * ✓ Organization access validation
 * ✓ Redirect on failure
 * ✓ URL cleanup after auth extraction
 * ✓ Loading states
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: jsdom with React
 * - Prerequisites: Next.js mocks, sessionStorage mock
 * - Runtime: <500ms
 * 
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQueryAuth } from '../useQueryAuth';
import { createMockJWT } from '@/test/utils/test-utils';

// Mock next/navigation with stable searchParams reference
const mockPush = vi.fn();
let currentSearchParams: URLSearchParams;

vi.mock('next/navigation', () => ({
  useSearchParams: () => currentSearchParams,
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Helper to create valid org JWT
function createValidOrgJWT(orgName: string): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  return createMockJWT({
    type: 'github_org',
    username: orgName,
    sub: 'user-123',
    exp: futureExp,
  });
}

// Helper to set mock URLSearchParams (mutates stable reference)
function setMockSearchParams(params: Record<string, string>): void {
  currentSearchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    currentSearchParams.set(key, value);
  });
}

describe('useQueryAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    
    // Initialize stable searchParams reference
    currentSearchParams = new URLSearchParams();
    
    // Mock window.history.replaceState
    Object.defineProperty(window, 'history', {
      value: {
        replaceState: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // ========================================================================
  // TEST: Initial Auth Extraction - No Token
  // ========================================================================

  describe('Initial Auth Extraction - No Token', () => {
    it('should_set_isLoading_false_after_initial_check', async () => {
      // ARRANGE
      setMockSearchParams({});

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT - Loading should eventually become false
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should_return_unauthenticated_when_no_auth_parameter', async () => {
      // ARRANGE
      setMockSearchParams({});

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isQueryAuthenticated).toBe(false);
      expect(result.current.jwtToken).toBeNull();
      expect(result.current.orgName).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  // ========================================================================
  // TEST: Valid Token Extraction
  // ========================================================================

  describe('Valid Token Extraction', () => {
    it('should_extract_and_validate_JWT_from_query_params', async () => {
      // ARRANGE
      const orgName = 'test-org';
      const validToken = createValidOrgJWT(orgName);
      setMockSearchParams({ _auth: validToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(true);
      expect(result.current.jwtToken).toBe(validToken);
      expect(result.current.orgName).toBe(orgName);
      expect(result.current.error).toBeNull();
    });

    it('should_store_token_in_sessionStorage', async () => {
      // ARRANGE
      const orgName = 'test-org';
      const validToken = createValidOrgJWT(orgName);
      setMockSearchParams({ _auth: validToken });

      // ACT
      renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(sessionStorage.getItem('query_jwt_token')).toBe(validToken);
        expect(sessionStorage.getItem('query_org_name')).toBe(orgName);
      });
    });

    it('should_remove_auth_parameter_from_URL', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('test-org');
      setMockSearchParams({ _auth: validToken });

      // ACT
      renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });
    });

    it('should_set_isLoading_false_after_validation', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('test-org');
      setMockSearchParams({ _auth: validToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ========================================================================
  // TEST: Invalid Token Handling
  // ========================================================================

  describe('Invalid Token Handling', () => {
    it('should_set_error_for_invalid_JWT_format', async () => {
      // ARRANGE
      const invalidToken = 'not-a-valid-jwt';
      setMockSearchParams({ _auth: invalidToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid JWT format');
    });

    it('should_not_redirect_by_default_on_invalid_token', async () => {
      // ARRANGE
      const invalidToken = 'not-a-valid-jwt';
      setMockSearchParams({ _auth: invalidToken });

      // ACT
      renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('should_redirect_on_invalid_token_when_redirectOnFailure_true', async () => {
      // ARRANGE
      const invalidToken = 'not-a-valid-jwt';
      setMockSearchParams({ _auth: invalidToken });

      // ACT
      renderHook(() => useQueryAuth({ redirectOnFailure: true }));

      // ASSERT
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/error?error=InvalidToken');
      });
    });

    it('should_set_error_for_expired_token', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createMockJWT({
        type: 'github_org',
        username: 'test-org',
        exp: pastExp,
      });
      setMockSearchParams({ _auth: expiredToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(false);
      expect(result.current.error).toBeDefined();
    });

    it('should_set_error_for_wrong_token_type', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const wrongTypeToken = createMockJWT({
        type: 'github_user',
        username: 'test-org',
        exp: futureExp,
      });
      setMockSearchParams({ _auth: wrongTypeToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(false);
      expect(result.current.error).toBe('Token type must be github_org');
    });
  });

  // ========================================================================
  // TEST: Organization Access Validation
  // ========================================================================

  describe('Organization Access Validation', () => {
    it('should_validate_org_access_when_requiredOrg_provided', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('test-org');
      setMockSearchParams({ _auth: validToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth({ requiredOrg: 'test-org' }));

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(true);
      expect(result.current.orgName).toBe('test-org');
    });

    it('should_deny_access_for_non_matching_org', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('wrong-org');
      setMockSearchParams({ _auth: validToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth({ requiredOrg: 'test-org' }));

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(false);
      expect(result.current.error).toBe('Access denied to organization: test-org');
    });

    it('should_redirect_on_access_denial_when_redirectOnFailure_true', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('wrong-org');
      setMockSearchParams({ _auth: validToken });

      // ACT
      renderHook(() => useQueryAuth({ requiredOrg: 'test-org', redirectOnFailure: true }));

      // ASSERT
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/error?error=AccessDenied');
      });
    });

    it('should_perform_case_insensitive_org_matching', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('Test-Org');
      setMockSearchParams({ _auth: validToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth({ requiredOrg: 'test-org' }));

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(true);
    });
  });

  // ========================================================================
  // TEST: SessionStorage Persistence
  // ========================================================================

  describe('SessionStorage Persistence', () => {
    it('should_load_token_from_sessionStorage_on_mount', async () => {
      // ARRANGE
      const orgName = 'test-org';
      const validToken = createValidOrgJWT(orgName);
      sessionStorage.setItem('query_jwt_token', validToken);
      sessionStorage.setItem('query_org_name', orgName);
      setMockSearchParams({}); // No _auth in URL

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(true);
      expect(result.current.jwtToken).toBe(validToken);
      expect(result.current.orgName).toBe(orgName);
    });

    it('should_validate_stored_token_before_using', async () => {
      // ARRANGE
      const invalidToken = 'invalid-stored-token';
      sessionStorage.setItem('query_jwt_token', invalidToken);
      sessionStorage.setItem('query_org_name', 'test-org');
      setMockSearchParams({});

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(false);
      expect(sessionStorage.getItem('query_jwt_token')).toBeNull();
      expect(sessionStorage.getItem('query_org_name')).toBeNull();
    });

    it('should_clear_invalid_stored_tokens', async () => {
      // ARRANGE
      const invalidToken = 'invalid';
      sessionStorage.setItem('query_jwt_token', invalidToken);
      sessionStorage.setItem('query_org_name', 'test-org');
      setMockSearchParams({});

      // ACT
      renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(sessionStorage.getItem('query_jwt_token')).toBeNull();
      });
    });

    it('should_check_org_access_for_stored_tokens', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('wrong-org');
      sessionStorage.setItem('query_jwt_token', validToken);
      sessionStorage.setItem('query_org_name', 'wrong-org');
      setMockSearchParams({});

      // ACT
      const { result } = renderHook(() => useQueryAuth({ requiredOrg: 'test-org' }));

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(false);
      expect(result.current.error).toBe('Access denied to organization: test-org');
      expect(sessionStorage.getItem('query_jwt_token')).toBeNull();
    });

    it('should_prefer_URL_token_over_sessionStorage', async () => {
      // ARRANGE
      const storedToken = createValidOrgJWT('stored-org');
      const urlToken = createValidOrgJWT('url-org');
      sessionStorage.setItem('query_jwt_token', storedToken);
      sessionStorage.setItem('query_org_name', 'stored-org');
      setMockSearchParams({ _auth: urlToken });

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.orgName).toBe('url-org');
      expect(sessionStorage.getItem('query_org_name')).toBe('url-org');
    });
  });

  // ========================================================================
  // TEST: State Updates and Re-renders
  // ========================================================================

  describe('State Updates and Re-renders', () => {
    it('should_update_when_searchParams_change', async () => {
      // ARRANGE
      const initialToken = createValidOrgJWT('org-1');
      setMockSearchParams({ _auth: initialToken });

      // ACT
      const { result, rerender } = renderHook(() => useQueryAuth());

      await waitFor(() => {
        expect(result.current.orgName).toBe('org-1');
      });

      // Change searchParams
      const newToken = createValidOrgJWT('org-2');
      setMockSearchParams({ _auth: newToken });

      // ASSERT
      rerender();

      await waitFor(() => {
        expect(result.current.orgName).toBe('org-2');
      });
    });

    it('should_clear_error_on_successful_auth', async () => {
      // ARRANGE
      const invalidToken = 'invalid';
      setMockSearchParams({ _auth: invalidToken });

      // ACT
      const { result, rerender } = renderHook(() => useQueryAuth());

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Change to valid token
      const validToken = createValidOrgJWT('test-org');
      setMockSearchParams({ _auth: validToken });

      // ASSERT
      rerender();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.isQueryAuthenticated).toBe(true);
      });
    });

    it('should_set_loading_false_after_sessionStorage_check', async () => {
      // ARRANGE
      setMockSearchParams({});

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // ========================================================================
  // TEST: Edge Cases
  // ========================================================================

  describe('Edge Cases', () => {
    it('should_handle_query_param_with_multiple_parameters', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('test-org');
      setMockSearchParams({
        _auth: validToken,
        foo: 'bar',
        baz: 'qux',
      });

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(true);
    });

    it('should_not_crash_when_sessionStorage_is_unavailable', async () => {
      // ARRANGE
      const originalSessionStorage = window.sessionStorage;
      
      try {
        Object.defineProperty(window, 'sessionStorage', {
          value: undefined,
          writable: true,
          configurable: true,
        });

        setMockSearchParams({});

        // ACT & ASSERT
        expect(() => {
          renderHook(() => useQueryAuth());
        }).not.toThrow();
      } finally {
        // Restore sessionStorage before afterEach runs
        Object.defineProperty(window, 'sessionStorage', {
          value: originalSessionStorage,
          writable: true,
          configurable: true,
        });
      }
    });

    it('should_handle_empty_org_name_in_stored_session', async () => {
      // ARRANGE
      const validToken = createValidOrgJWT('test-org');
      sessionStorage.setItem('query_jwt_token', validToken);
      sessionStorage.setItem('query_org_name', '');
      setMockSearchParams({});

      // ACT
      const { result } = renderHook(() => useQueryAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isQueryAuthenticated).toBe(true);
    });
  });
});


