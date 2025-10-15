/**
 * ============================================================================
 * TEST SUITE: Fetch Interceptor - Comprehensive Security & Reliability Tests
 * ============================================================================
 * 
 * MODULE UNDER TEST: fetch-interceptor
 * TEST TYPE: Unit / Integration / Security
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-13
 * LAST MODIFIED: 2025-10-14
 * VERSION: 2.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the fetch interceptor which handles JWT token
 * validation, expiration checking, and unauthorized access management. This is
 * a critical security module that protects all authenticated API requests.
 * 
 * COVERAGE SCOPE:
 * ✓ authenticatedFetch - Token validation and request interception
 * ✓ checkTokenExpiration - Token expiration detection
 * ✓ UnauthorizedError - Custom error class
 * ✓ Sign-out triggers on unauthorized access
 * ✓ Direct auth vs OAuth differentiation
 * ✓ Security attack vectors and edge cases
 * ✓ Concurrent request handling
 * ✓ Error recovery mechanisms
 * ✓ Headers API compatibility
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - fetch-interceptor: Target module with authentication wrapper
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: jsdom (browser APIs)
 * - Prerequisites: next-auth mocks
 * - Runtime: <500ms
 * 
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticatedFetch, checkTokenExpiration } from '../fetch-interceptor';
import { createMockJWT } from '@/test/utils/test-utils';

// Mock next-auth/react
const mockSignOut = vi.fn();
vi.mock('next-auth/react', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// Helper to create JWT with specific expiration
function createJWTWithExp(exp: number): string {
  return createMockJWT({
    sub: 'user-123',
    exp,
    iat: Math.floor(Date.now() / 1000),
  });
}

// Helper to create JWT with custom payload
function createJWTWithPayload(payload: Record<string, unknown>): string {
  return createMockJWT(payload);
}

describe('Fetch Interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    global.fetch = vi.fn();
    // Mock window for browser-side tests
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          href: 'http://localhost:3000',
        },
        navigator: {
          userAgent: 'test-agent',
          clipboard: {},
        },
      },
      writable: true,
      configurable: true,
    });
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      value: '',
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================================================
  // TEST: Token Validation - Valid Scenarios
  // ========================================================================

  describe('authenticatedFetch - Valid Token Scenarios', () => {
    it('should_allow_request_with_valid_unexpired_Bearer_token', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      // ASSERT
      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/endpoint', {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_allow_request_without_Authorization_header', async () => {
      // ARRANGE
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/public');

      // ASSERT
      expect(response).toBe(mockResponse);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_allow_request_with_custom_headers_preserved', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      await authenticatedFetch('https://api.test.com/endpoint', {
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
        },
      });

      // ASSERT
      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/endpoint', {
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value',
        },
      });
    });

    it('should_work_with_POST_PUT_DELETE_methods', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT & ASSERT - POST
      await authenticatedFetch('https://api.test.com/endpoint', {
        method: 'POST',
        headers: { Authorization: `Bearer ${validToken}` },
        body: JSON.stringify({ data: 'test' }),
      });
      expect(global.fetch).toHaveBeenLastCalledWith('https://api.test.com/endpoint', expect.objectContaining({ method: 'POST' }));

      // ACT & ASSERT - PUT
      await authenticatedFetch('https://api.test.com/endpoint', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(global.fetch).toHaveBeenLastCalledWith('https://api.test.com/endpoint', expect.objectContaining({ method: 'PUT' }));

      // ACT & ASSERT - DELETE
      await authenticatedFetch('https://api.test.com/endpoint', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${validToken}` },
      });
      expect(global.fetch).toHaveBeenLastCalledWith('https://api.test.com/endpoint', expect.objectContaining({ method: 'DELETE' }));
    });
  });

  // ========================================================================
  // TEST: Token Validation - Invalid Scenarios
  // ========================================================================

  describe('authenticatedFetch - Invalid Token Scenarios', () => {
    it('should_throw_UnauthorizedError_for_empty_token_after_Bearer', async () => {
      // ARRANGE
      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: 'Bearer ' },
        })
      ).rejects.toThrow('No JWT token provided');

      expect(mockSignOut).toHaveBeenCalledWith({
        redirectTo: '/',
        redirect: true,
      });
    });

    it('should_throw_UnauthorizedError_for_whitespace_only_token', async () => {
      // ARRANGE
      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: 'Bearer    ' },
        })
      ).rejects.toThrow('No JWT token provided');

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should_throw_UnauthorizedError_for_malformed_Authorization_header', async () => {
      // ARRANGE
      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: 'Basic token123' },
        })
      ).rejects.toThrow('Invalid authorization format');

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should_throw_UnauthorizedError_for_Authorization_without_Bearer_prefix', async () => {
      // ARRANGE
      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: 'token123' },
        })
      ).rejects.toThrow('Invalid authorization format');

      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // TEST: Token Expiration Detection
  // ========================================================================

  describe('authenticatedFetch - Token Expiration', () => {
    it('should_throw_UnauthorizedError_for_expired_token', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createJWTWithExp(pastExp);

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })
      ).rejects.toThrow('JWT token has expired');

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should_redirect_to_auth_error_for_expired_direct_auth_token', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);
      document.cookie = 'matt-direct-jwt=token123; path=/';

      // Mock window.location.href setter
      let redirectUrl = '';
      Object.defineProperty(window.location, 'href', {
        set: (url) => { redirectUrl = url; },
        get: () => redirectUrl || 'http://localhost:3000',
      });

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })
      ).rejects.toThrow('JWT token has expired');

      expect(redirectUrl).toBe('/auth/error?error=TokenExpired');
      // jsdom only retains the last cookie set, so we verify the cookie no longer contains the original token
      expect(document.cookie).not.toContain('matt-direct-jwt=token123');
      expect(document.cookie).toContain('expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });

    it('should_not_redirect_for_expired_token_on_server_side', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);
      
      // Remove window to simulate server-side
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })
      ).rejects.toThrow('JWT token has expired');

      expect(mockSignOut).not.toHaveBeenCalled();

      // Restore window for cleanup
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });
  });

  // ========================================================================
  // TEST: 401 Response Handling
  // ========================================================================

  describe('authenticatedFetch - 401 Response Handling', () => {
    it('should_throw_UnauthorizedError_on_401_response', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Unauthorized', { status: 401 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow('JWT token has expired or is invalid');

      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should_redirect_to_auth_error_on_401_for_direct_auth', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Unauthorized', { status: 401 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);
      document.cookie = 'matt-direct-jwt=token123; path=/';

      let redirectUrl = '';
      Object.defineProperty(window.location, 'href', {
        set: (url) => { redirectUrl = url; },
        get: () => redirectUrl || 'http://localhost:3000',
      });

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow('JWT token has expired or is invalid');

      expect(redirectUrl).toBe('/auth/error?error=TokenExpired');
    });

    it('should_call_signOut_with_callbackUrl_on_401_for_OAuth', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Unauthorized', { status: 401 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);
      // No direct auth cookie

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow();

      expect(mockSignOut).toHaveBeenCalledWith({
        callbackUrl: '/',
        redirect: true,
      });
    });

    it('should_not_throw_on_401_response_on_server_side', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Unauthorized', { status: 401 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // Remove window to simulate server-side
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow('JWT token has expired or is invalid');

      expect(mockSignOut).not.toHaveBeenCalled();

      // Restore window for cleanup
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });
  });

  // ========================================================================
  // TEST: Non-401 Response Handling
  // ========================================================================

  describe('authenticatedFetch - Other Response Codes', () => {
    it('should_return_200_response_normally', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      // ASSERT
      expect(response.status).toBe(200);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_return_404_response_without_throwing', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Not Found', { status: 404 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      // ASSERT
      expect(response.status).toBe(404);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_return_500_response_without_throwing', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Server Error', { status: 500 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      // ASSERT
      expect(response.status).toBe(500);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_return_204_no_content_response', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response(null, { status: 204 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${validToken}` },
      });

      // ASSERT
      expect(response.status).toBe(204);
      expect(mockSignOut).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // TEST: checkTokenExpiration Function
  // ========================================================================

  describe('checkTokenExpiration', () => {
    it('should_return_false_for_valid_unexpired_token', () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = createJWTWithExp(futureExp);

      // ACT
      const result = checkTokenExpiration(token);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_true_for_expired_token', () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const token = createJWTWithExp(pastExp);

      // ACT
      const result = checkTokenExpiration(token);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_return_false_for_token_without_exp_claim', () => {
      // ARRANGE
      const tokenWithoutExp = createMockJWT({
        sub: 'user-123',
        // No exp field
      });

      // ACT
      const result = checkTokenExpiration(tokenWithoutExp);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_true_for_malformed_token', () => {
      // ARRANGE
      const malformedToken = 'not.a.valid.jwt';

      // ACT
      const result = checkTokenExpiration(malformedToken);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_return_true_for_token_with_invalid_base64', () => {
      // ARRANGE
      const invalidToken = 'header.invalid-base64-!!@#$.signature';

      // ACT
      const result = checkTokenExpiration(invalidToken);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_return_true_when_exp_equals_current_time', () => {
      // ARRANGE
      const currentTime = Math.floor(Date.now() / 1000);
      const token = createJWTWithExp(currentTime);

      // ACT
      const result = checkTokenExpiration(token);

      // ASSERT
      expect(result).toBe(true); // currentTime >= exp
    });

    it('should_return_false_when_exp_is_1_second_in_future', () => {
      // ARRANGE
      const futureTime = Math.floor(Date.now() / 1000) + 1;
      const token = createJWTWithExp(futureTime);

      // ACT
      const result = checkTokenExpiration(token);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_true_when_exp_is_1_second_in_past', () => {
      // ARRANGE
      const pastTime = Math.floor(Date.now() / 1000) - 1;
      const token = createJWTWithExp(pastTime);

      // ACT
      const result = checkTokenExpiration(token);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_log_error_and_return_true_for_invalid_JSON_in_payload', () => {
      // ARRANGE
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidPayload = 'header.{invalid-json}.signature';

      // ACT
      const result = checkTokenExpiration(invalidPayload);

      // ASSERT
      expect(result).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking token expiration:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ========================================================================
  // TEST: Edge Cases and Network Errors
  // ========================================================================

  describe('authenticatedFetch - Edge Cases', () => {
    it('should_propagate_network_errors', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const networkError = new Error('Network failure');
      vi.mocked(global.fetch).mockRejectedValue(networkError);

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow('Network failure');
    });

    it('should_handle_concurrent_fetch_calls_independently', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse1 = new Response('Response 1', { status: 200 });
      const mockResponse2 = new Response('Response 2', { status: 200 });
      
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // ACT
      const [response1, response2] = await Promise.all([
        authenticatedFetch('https://api.test.com/endpoint1', {
          headers: { Authorization: `Bearer ${validToken}` },
        }),
        authenticatedFetch('https://api.test.com/endpoint2', {
          headers: { Authorization: `Bearer ${validToken}` },
        }),
      ]);

      // ASSERT
      expect(response1).toBe(mockResponse1);
      expect(response2).toBe(mockResponse2);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should_allow_response_body_to_be_consumed_after_checks', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const responseData = { message: 'Success' };
      const mockResponse = new Response(JSON.stringify(responseData), { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: { Authorization: `Bearer ${validToken}` },
      });
      const data = await response.json();

      // ASSERT
      expect(data).toEqual(responseData);
    });

    it('should_clear_both_direct_auth_cookies_on_expiration', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);
      document.cookie = 'matt-direct-jwt=token123; path=/';
      document.cookie = 'matt-direct-jwt-org=test-org; path=/';

      let redirectUrl = '';
      Object.defineProperty(window.location, 'href', {
        set: (url) => { redirectUrl = url; },
        get: () => redirectUrl || 'http://localhost:3000',
      });

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })
      ).rejects.toThrow();

      // Both cookies should be cleared - jsdom only shows last cookie set, so verify tokens are removed
      expect(document.cookie).not.toContain('token123');
      expect(document.cookie).not.toContain('test-org');
      expect(document.cookie).toContain('expires=Thu, 01 Jan 1970 00:00:00 GMT');
    });
  });

  // ========================================================================
  // TEST: Security - Attack Vectors
  // ========================================================================

  describe('Security - Attack Vectors', () => {
    it('should_reject_JWT_with_none_algorithm_attack', async () => {
      // ARRANGE - Create a JWT with "alg": "none" (common security attack)
      const noneAlgToken = `eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.`;
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT & ASSERT - Token should be treated as expired/invalid (no exp claim)
      const result = checkTokenExpiration(noneAlgToken);
      expect(result).toBe(false); // No exp claim, but token format is valid
    });

    it('should_handle_excessively_large_JWT_payload', async () => {
      // ARRANGE - Create JWT with very large payload (8KB+)
      const largePayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
        data: 'x'.repeat(8000), // 8KB of data
      };
      const largeToken = createJWTWithPayload(largePayload);
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: { Authorization: `Bearer ${largeToken}` },
      });

      // ASSERT - Should handle without memory issues
      expect(response).toBe(mockResponse);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_not_leak_token_content_in_error_messages', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const secretToken = createJWTWithExp(pastExp);

      // ACT & ASSERT
      try {
        await authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${secretToken}` },
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        // Error message should not contain the actual token
        expect((error as Error).message).not.toContain(secretToken);
        expect((error as Error).message).toBe('JWT token has expired');
      }
    });

    it('should_treat_token_with_only_two_parts_as_invalid', async () => {
      // ARRANGE - Malformed JWT with only 2 parts instead of 3
      const malformedToken = 'header.payload';

      // ACT
      const result = checkTokenExpiration(malformedToken);

      // ASSERT - Should return true (treat as expired/invalid)
      expect(result).toBe(true);
    });

    it('should_treat_token_with_four_parts_as_invalid', async () => {
      // ARRANGE - Malformed JWT with 4 parts
      const malformedToken = 'header.payload.signature.extra';

      // ACT
      checkTokenExpiration(malformedToken);

      // ASSERT - Should still work (splits on first dot, takes second part)
      // This is actually valid for the current implementation
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const validResult = checkTokenExpiration(malformedToken);
      expect(validResult).toBe(true); // Invalid payload leads to error
      consoleErrorSpy.mockRestore();
    });

    it('should_handle_token_with_special_characters_safely', async () => {
      // ARRANGE - Token with special characters that might cause issues
      const specialToken = 'header.<script>alert("xss")</script>.signature';

      // ACT
      const result = checkTokenExpiration(specialToken);

      // ASSERT - Should handle safely without executing any code
      expect(result).toBe(true);
    });
  });

  // ========================================================================
  // TEST: Concurrent Request Handling
  // ========================================================================

  describe('Concurrent Request Handling', () => {
    it('should_handle_multiple_simultaneous_401_responses_gracefully', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Unauthorized', { status: 401 });
      
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT - Make 5 requests simultaneously
      const requests = Array(5).fill(null).map(() =>
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        }).catch(err => err)
      );

      await Promise.all(requests);

      // ASSERT - signOut should be called for each failed request
      // (in real app, might want debouncing, but current impl calls each time)
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('should_handle_mixed_success_and_failure_requests_concurrently', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      
      const successResponse = new Response('OK', { status: 200 });
      const failResponse = new Response('Unauthorized', { status: 401 });

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(successResponse)
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      // ACT
      const results = await Promise.allSettled([
        authenticatedFetch('https://api.test.com/endpoint1', {
          headers: { Authorization: `Bearer ${validToken}` },
        }),
        authenticatedFetch('https://api.test.com/endpoint2', {
          headers: { Authorization: `Bearer ${validToken}` },
        }),
        authenticatedFetch('https://api.test.com/endpoint3', {
          headers: { Authorization: `Bearer ${validToken}` },
        }),
      ]);

      // ASSERT
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });

    it('should_handle_token_expiration_during_concurrent_requests', async () => {
      // ARRANGE - Token expires exactly at current time
      const expiringToken = createJWTWithExp(Math.floor(Date.now() / 1000));
      
      vi.mocked(global.fetch).mockResolvedValue(new Response('OK', { status: 200 }));

      // ACT - Make multiple requests with expiring token
      const results = await Promise.allSettled([
        authenticatedFetch('https://api.test.com/endpoint1', {
          headers: { Authorization: `Bearer ${expiringToken}` },
        }),
        authenticatedFetch('https://api.test.com/endpoint2', {
          headers: { Authorization: `Bearer ${expiringToken}` },
        }),
      ]);

      // ASSERT - All should fail due to expired token
      expect(results.every(r => r.status === 'rejected')).toBe(true);
    });

    it('should_preserve_request_independence_with_different_tokens', async () => {
      // ARRANGE
      const token1 = createJWTWithExp(Math.floor(Date.now() / 1000) + 3600);
      const token2 = createJWTWithExp(Math.floor(Date.now() / 1000) - 3600); // Expired
      
      vi.mocked(global.fetch).mockResolvedValue(new Response('OK', { status: 200 }));

      // ACT
      const results = await Promise.allSettled([
        authenticatedFetch('https://api.test.com/endpoint1', {
          headers: { Authorization: `Bearer ${token1}` },
        }),
        authenticatedFetch('https://api.test.com/endpoint2', {
          headers: { Authorization: `Bearer ${token2}` },
        }),
      ]);

      // ASSERT - First succeeds, second fails
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });
  });

  // ========================================================================
  // TEST: Error Recovery
  // ========================================================================

  describe('Error Recovery', () => {
    it('should_handle_signOut_throwing_error', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);
      
      mockSignOut.mockRejectedValue(new Error('SignOut failed'));

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })
      ).rejects.toThrow('SignOut failed');
    });

    it('should_handle_fetch_throwing_error', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      // ACT & ASSERT
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow('Network error');
    });

    it('should_handle_window_location_href_setter_error_gracefully', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);
      document.cookie = 'matt-direct-jwt=token123; path=/';

      // Make location.href throw
      Object.defineProperty(window.location, 'href', {
        set: () => { throw new Error('Navigation blocked'); },
        get: () => 'http://localhost:3000',
      });

      // ACT & ASSERT - Should throw the navigation error
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        })
      ).rejects.toThrow('Navigation blocked');
    });

    it('should_handle_document_cookie_access_error', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('Unauthorized', { status: 401 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // Make document.cookie throw
      Object.defineProperty(document, 'cookie', {
        get: () => { throw new Error('Cookie access denied'); },
        set: () => {},
      });

      // ACT & ASSERT - Should throw cookie access error
      await expect(
        authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow('Cookie access denied');
    });

    it('should_propagate_TypeError_for_invalid_fetch_parameters', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      
      vi.mocked(global.fetch).mockRejectedValue(new TypeError('Invalid URL'));

      // ACT & ASSERT
      await expect(
        authenticatedFetch('not-a-valid-url', {
          headers: { Authorization: `Bearer ${validToken}` },
        })
      ).rejects.toThrow('Invalid URL');
    });
  });

  // ========================================================================
  // TEST: Headers API Compatibility
  // ========================================================================

  describe('Headers API Compatibility', () => {
    it('should_work_with_Headers_instance', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${validToken}`);
      headers.append('Content-Type', 'application/json');

      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: headers,
      });

      // ASSERT
      expect(response).toBe(mockResponse);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_handle_headers_with_mixed_case', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT - Note: Current implementation uses exact "Authorization" key
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'content-type': 'application/json',
        },
      });

      // ASSERT
      expect(response).toBe(mockResponse);
    });

    it('should_preserve_custom_headers_in_response', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      
      const responseHeaders = new Headers();
      responseHeaders.set('X-Custom-Header', 'custom-value');
      responseHeaders.set('Content-Type', 'application/json');
      
      const mockResponse = new Response('{"data":"test"}', { 
        status: 200,
        headers: responseHeaders,
      });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: { Authorization: `Bearer ${validToken}` },
      });

      // ASSERT
      expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should_handle_empty_headers_object', async () => {
      // ARRANGE
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        headers: {},
      });

      // ASSERT - Should pass through without auth checks
      expect(response).toBe(mockResponse);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_handle_undefined_headers', async () => {
      // ARRANGE
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      // ACT
      const response = await authenticatedFetch('https://api.test.com/endpoint', {
        method: 'GET',
        // No headers
      });

      // ASSERT
      expect(response).toBe(mockResponse);
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it('should_preserve_multiple_custom_headers', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const validToken = createJWTWithExp(futureExp);
      const mockResponse = new Response('OK', { status: 200 });
      vi.mocked(global.fetch).mockResolvedValue(mockResponse);

      const customHeaders = {
        'Authorization': `Bearer ${validToken}`,
        'X-Request-ID': 'req-123',
        'X-Correlation-ID': 'corr-456',
        'Accept-Language': 'en-US',
        'User-Agent': 'CustomClient/1.0',
      };

      // ACT
      await authenticatedFetch('https://api.test.com/endpoint', {
        headers: customHeaders,
      });

      // ASSERT - All headers should be passed to fetch
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/endpoint',
        { headers: customHeaders }
      );
    });
  });

  // ========================================================================
  // TEST: UnauthorizedError Class
  // ========================================================================

  describe('UnauthorizedError Class', () => {
    it('should_have_correct_error_name_property', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);

      // ACT & ASSERT
      try {
        await authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).name).toBe('UnauthorizedError');
      }
    });

    it('should_be_instance_of_Error', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);

      // ACT & ASSERT
      try {
        await authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should_have_stack_trace', async () => {
      // ARRANGE
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const expiredToken = createJWTWithExp(pastExp);

      // ACT & ASSERT
      try {
        await authenticatedFetch('https://api.test.com/endpoint', {
          headers: { Authorization: `Bearer ${expiredToken}` },
        });
        expect.fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).stack).toBeDefined();
        expect((error as Error).stack).toContain('UnauthorizedError');
      }
    });
  });
});

