/**
 * ============================================================================
 * TEST SUITE: Direct Authentication
 * ============================================================================
 * 
 * MODULE UNDER TEST: direct-auth
 * TEST TYPE: Unit / Integration
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-13
 * LAST MODIFIED: 2025-10-13
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for direct JWT authentication which creates
 * NextAuth sessions from JWT tokens. Critical for secure session creation,
 * cookie management, and environment-specific security configurations.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - direct-auth: Target module with session creation functions
 * - jose: JWT signing library
 * 
 * COVERAGE SCOPE:
 * ✓ createDirectAuthSession - Session creation with JWT validation
 * ✓ clearDirectAuthSession - Session cleanup
 * ✓ Cookie security (HttpOnly, Secure, SameSite)
 * ✓ Environment-based cookie naming
 * ✓ JWT token signing and validation
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js
 * - Prerequisites: Next.js mocks, jose mocks
 * - Runtime: <150ms
 * 
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDirectAuthSession, clearDirectAuthSession } from '../direct-auth';
import { createMockJWT } from '@/test/utils/test-utils';

// Mock next/headers
const mockSet = vi.fn();
const mockDelete = vi.fn();
const mockCookies = vi.fn(() => ({
  set: mockSet,
  delete: mockDelete,
}));

vi.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}));

// Mock jose SignJWT
const mockSign = vi.fn();
const mockSetProtectedHeader = vi.fn(() => ({ sign: mockSign }));
vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: mockSetProtectedHeader,
  })),
}));

// Helper to create valid org JWT
function createValidOrgJWT(orgName: string): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  return createMockJWT({
    type: 'github_org',
    username: orgName,
    sub: 'user-123',
    name: 'Test User',
    avatar_url: 'https://avatar.test/user.png',
    html_url: 'https://github.com/testuser',
    exp: futureExp,
  });
}

describe('Direct Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful token signing
    mockSign.mockResolvedValue('signed-session-token-abc123');
    // Set NODE_ENV to development by default
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXTAUTH_SECRET', 'test-secret-key-for-testing');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ========================================================================
  // TEST: createDirectAuthSession - Success Cases
  // ========================================================================

  describe('createDirectAuthSession - Success Cases', () => {
    it('should_return_true_for_valid_JWT_token', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      const result = await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_validate_JWT_token_before_creating_session', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSign).toHaveBeenCalled();
    });

    it('should_create_session_cookie_with_correct_development_name', async () => {
      // ARRANGE
      vi.stubEnv('NODE_ENV', 'development');
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        'next-auth.session-token',
        'signed-session-token-abc123',
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
        })
      );
    });

    it('should_create_session_cookie_with_correct_production_name', async () => {
      // ARRANGE
      vi.stubEnv('NODE_ENV', 'production');
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        '__Secure-next-auth.session-token',
        'signed-session-token-abc123',
        expect.any(Object)
      );
    });

    it('should_set_HttpOnly_flag_on_cookie', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
    });

    it('should_set_Secure_flag_in_production', async () => {
      // ARRANGE
      vi.stubEnv('NODE_ENV', 'production');
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ secure: true })
      );
    });

    it('should_not_set_Secure_flag_in_development', async () => {
      // ARRANGE
      vi.stubEnv('NODE_ENV', 'development');
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ secure: false })
      );
    });

    it('should_set_SameSite_lax', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ sameSite: 'lax' })
      );
    });

    it('should_set_maxAge_to_30_days', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ maxAge: thirtyDaysInSeconds })
      );
    });

    it('should_set_cookie_path_to_root', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ path: '/' })
      );
    });

    it('should_sign_session_token_with_HS256_algorithm', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(mockSetProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
    });

    it('should_include_mattJwtToken_in_session', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const { SignJWT } = await import('jose');
      
      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          mattJwtToken: jwtToken,
        })
      );
    });

    it('should_include_orgName_in_session', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const { SignJWT } = await import('jose');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          orgName: 'test-org',
        })
      );
    });

    it('should_include_directJWT_flag_in_session', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const { SignJWT } = await import('jose');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          directJWT: true,
        })
      );
    });

    it('should_include_type_github_org_in_session', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const { SignJWT } = await import('jose');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'github_org',
        })
      );
    });

    it('should_include_mattUser_fields_in_session', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const { SignJWT } = await import('jose');

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          mattUser: expect.objectContaining({
            id: expect.any(String),
            login: expect.any(String),
            name: expect.any(String),
          }),
        })
      );
    });

    it('should_include_iat_and_exp_claims', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const { SignJWT } = await import('jose');
      const beforeTime = Math.floor(Date.now() / 1000);

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      const afterTime = Math.floor(Date.now() / 1000);

      // ASSERT
      expect(SignJWT).toHaveBeenCalledWith(
        expect.objectContaining({
          iat: expect.any(Number),
          exp: expect.any(Number),
        })
      );

      const callArgs = vi.mocked(SignJWT).mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      
      // Type assertion after verification
      const iat = callArgs!.iat as number;
      const exp = callArgs!.exp as number;
      
      expect(iat).toBeGreaterThanOrEqual(beforeTime);
      expect(iat).toBeLessThanOrEqual(afterTime);
      expect(exp).toBeGreaterThan(iat);
    });
  });

  // ========================================================================
  // TEST: createDirectAuthSession - Failure Cases
  // ========================================================================

  describe('createDirectAuthSession - Failure Cases', () => {
    it('should_return_false_for_invalid_JWT_token', async () => {
      // ARRANGE
      const invalidToken = 'not-a-valid-jwt';

      // ACT
      const result = await createDirectAuthSession({
        jwtToken: invalidToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(result).toBe(false);
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should_return_false_for_malformed_JWT', async () => {
      // ARRANGE
      const malformedToken = 'header.payload';

      // ACT
      const result = await createDirectAuthSession({
        jwtToken: malformedToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_false_for_JWT_with_wrong_type', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const wrongTypeToken = createMockJWT({
        type: 'github_user', // Wrong type
        username: 'test-org',
        exp: futureExp,
      });

      // ACT
      const result = await createDirectAuthSession({
        jwtToken: wrongTypeToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_log_error_for_invalid_JWT_token', async () => {
      // ARRANGE
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidToken = 'not-a-valid-jwt';

      // ACT
      await createDirectAuthSession({
        jwtToken: invalidToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid JWT token for direct auth:',
        expect.any(String)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should_return_false_when_token_signing_fails', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      mockSign.mockRejectedValue(new Error('Signing failed'));

      // ACT
      const result = await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_log_error_when_token_signing_fails', async () => {
      // ARRANGE
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const jwtToken = createValidOrgJWT('test-org');
      mockSign.mockRejectedValue(new Error('Signing failed'));

      // ACT
      await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to create direct auth session:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should_return_false_when_cookie_setting_fails', async () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      mockSet.mockImplementation(() => {
        throw new Error('Cookie error');
      });

      // ACT
      const result = await createDirectAuthSession({
        jwtToken,
        orgName: 'test-org',
      });

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_false_for_token_without_username', async () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const tokenWithoutUsername = createMockJWT({
        type: 'github_org',
        // Missing username
        exp: futureExp,
      });

      // ACT
      const result = await createDirectAuthSession({
        jwtToken: tokenWithoutUsername,
        orgName: 'test-org',
      });

      // ASSERT
      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // TEST: clearDirectAuthSession
  // ========================================================================

  describe('clearDirectAuthSession', () => {
    it('should_delete_cookie_with_development_name', async () => {
      // ARRANGE
      vi.stubEnv('NODE_ENV', 'development');

      // ACT
      await clearDirectAuthSession();

      // ASSERT
      expect(mockDelete).toHaveBeenCalledWith('next-auth.session-token');
    });

    it('should_delete_cookie_with_production_name', async () => {
      // ARRANGE
      vi.stubEnv('NODE_ENV', 'production');

      // ACT
      await clearDirectAuthSession();

      // ASSERT
      expect(mockDelete).toHaveBeenCalledWith('__Secure-next-auth.session-token');
    });

    it('should_not_throw_when_cookie_deletion_fails', async () => {
      // ARRANGE
      mockDelete.mockImplementation(() => {
        throw new Error('Deletion error');
      });

      // ACT & ASSERT
      await expect(clearDirectAuthSession()).resolves.not.toThrow();
    });

    it('should_log_error_when_cookie_deletion_fails', async () => {
      // ARRANGE
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDelete.mockImplementation(() => {
        throw new Error('Deletion error');
      });

      // ACT
      await clearDirectAuthSession();

      // ASSERT
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to clear direct auth session:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should_complete_successfully_when_cookie_does_not_exist', async () => {
      // ARRANGE
      mockDelete.mockImplementation(() => {
        // Cookie doesn't exist, no-op
      });

      // ACT & ASSERT
      await expect(clearDirectAuthSession()).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalled();
    });
  });
});


