/**
 * ============================================================================
 * TEST SUITE: Query Authentication Utilities
 * ============================================================================
 * 
 * MODULE UNDER TEST: query-auth
 * TEST TYPE: Unit
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-13
 * LAST MODIFIED: 2025-10-13
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for query parameter authentication utilities.
 * These functions handle JWT token extraction from URL query parameters,
 * validation, and organization access verification. Critical for public API
 * authentication vectors.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - query-auth: Target module with query-based auth functions
 * - jwt-utils: JWT validation utilities
 * 
 * COVERAGE SCOPE:
 * ✓ extractQueryAuth - Query parameter JWT extraction and validation
 * ✓ validateOrgAccess - Organization access verification
 * ✓ extractOrgFromPath - URL path parsing for org names
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js
 * - Prerequisites: None (pure functions)
 * - Runtime: <100ms
 * 
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { extractQueryAuth, validateOrgAccess, extractOrgFromPath } from '../query-auth';
import { NextRequest } from 'next/server';
import { createMockJWT } from '@/test/utils/test-utils';

// Helper to create valid JWT with org type
function createValidOrgJWT(orgName: string): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  return createMockJWT({
    type: 'github_org',
    username: orgName,
    sub: 'user-123',
    exp: futureExp,
    iat: Math.floor(Date.now() / 1000),
  });
}

describe('Query Authentication Utilities', () => {
  // ========================================================================
  // TEST: extractQueryAuth
  // ========================================================================
  describe('extractQueryAuth', () => {
    it('should_return_unauthenticated_when_no_auth_parameter', () => {
      // ARRANGE
      const request = new NextRequest('http://localhost:3000/page');

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(false);
      expect(result.jwtToken).toBeUndefined();
      expect(result.orgName).toBeUndefined();
      expect(result.error).toBeUndefined();
    });

    it('should_return_authenticated_with_valid_JWT_token', () => {
      // ARRANGE
      const orgName = 'test-org';
      const validToken = createValidOrgJWT(orgName);
      const request = new NextRequest(`http://localhost:3000/page?_auth=${validToken}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(true);
      expect(result.jwtToken).toBe(validToken);
      expect(result.orgName).toBe(orgName);
      expect(result.error).toBeUndefined();
    });

    it('should_extract_jwtToken_and_orgName_correctly', () => {
      // ARRANGE
      const orgName = 'my-awesome-org';
      const validToken = createValidOrgJWT(orgName);
      const request = new NextRequest(`http://localhost:3000/page?_auth=${validToken}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.jwtToken).toBe(validToken);
      expect(result.orgName).toBe(orgName);
    });

    it('should_return_error_for_invalid_JWT_format', () => {
      // ARRANGE
      const invalidToken = 'not-a-valid-jwt';
      const request = new NextRequest(`http://localhost:3000/page?_auth=${invalidToken}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBe('Invalid JWT format');
      expect(result.jwtToken).toBeUndefined();
      expect(result.orgName).toBeUndefined();
    });

    it('should_return_unauthenticated_for_expired_token', () => {
      // ARRANGE
      // NOTE: extractQueryAuth now validates token expiration for security
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createMockJWT({
        type: 'github_org',
        username: 'test-org',
        exp: pastExp,
      });
      const request = new NextRequest(`http://localhost:3000/page?_auth=${expiredToken}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      // Expiration is now checked during JWT validation
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBe('Token has expired');
    });

    it('should_return_error_for_wrong_token_type', () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const wrongTypeToken = createMockJWT({
        type: 'github_user', // Wrong type
        username: 'test-org',
        exp: futureExp,
      });
      const request = new NextRequest(`http://localhost:3000/page?_auth=${wrongTypeToken}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBe('Token type must be github_org');
    });

    it('should_handle_URL_with_multiple_query_parameters', () => {
      // ARRANGE
      const validToken = createValidOrgJWT('test-org');
      const request = new NextRequest(`http://localhost:3000/page?foo=bar&_auth=${validToken}&baz=qux`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(true);
      expect(result.jwtToken).toBe(validToken);
    });

    it('should_handle_URL_encoded_query_parameters', () => {
      // ARRANGE
      const validToken = createValidOrgJWT('test-org');
      const encodedToken = encodeURIComponent(validToken);
      const request = new NextRequest(`http://localhost:3000/page?_auth=${encodedToken}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(true);
      expect(result.jwtToken).toBe(validToken);
    });

    it('should_return_error_for_token_without_username', () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const tokenWithoutUsername = createMockJWT({
        type: 'github_org',
        // Missing username
        exp: futureExp,
      });
      const request = new NextRequest(`http://localhost:3000/page?_auth=${tokenWithoutUsername}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBe('Token must contain organization name in username field');
    });

    it('should_return_default_error_message_when_validation_error_is_undefined', () => {
      // ARRANGE
      const malformedToken = 'clearly.invalid.token.structure.extra';
      const request = new NextRequest(`http://localhost:3000/page?_auth=${malformedToken}`);

      // ACT
      const result = extractQueryAuth(request);

      // ASSERT
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });
  });

  // ========================================================================
  // TEST: validateOrgAccess
  // ========================================================================
  describe('validateOrgAccess', () => {
    it('should_return_true_for_matching_org_exact_match', () => {
      // ARRANGE
      const orgName = 'test-org';
      const jwtToken = createValidOrgJWT(orgName);
      const requestedOrg = 'test-org';

      // ACT
      const result = validateOrgAccess(jwtToken, requestedOrg);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_return_true_for_case_insensitive_match_lowercase', () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('test-org');
      const requestedOrg = 'TEST-ORG';

      // ACT
      const result = validateOrgAccess(jwtToken, requestedOrg);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_return_true_for_case_insensitive_match_uppercase', () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('TEST-ORG');
      const requestedOrg = 'test-org';

      // ACT
      const result = validateOrgAccess(jwtToken, requestedOrg);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_return_true_for_case_insensitive_match_mixed_case', () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('MyAwesomeOrg');
      const requestedOrg = 'myawesomeorg';

      // ACT
      const result = validateOrgAccess(jwtToken, requestedOrg);

      // ASSERT
      expect(result).toBe(true);
    });

    it('should_return_false_for_non_matching_org', () => {
      // ARRANGE
      const jwtToken = createValidOrgJWT('org-a');
      const requestedOrg = 'org-b';

      // ACT
      const result = validateOrgAccess(jwtToken, requestedOrg);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_false_for_invalid_token', () => {
      // ARRANGE
      const invalidToken = 'not-a-valid-jwt';
      const requestedOrg = 'test-org';

      // ACT
      const result = validateOrgAccess(invalidToken, requestedOrg);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_false_for_token_with_wrong_type', () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const wrongTypeToken = createMockJWT({
        type: 'github_user',
        username: 'test-org',
        exp: futureExp,
      });
      const requestedOrg = 'test-org';

      // ACT
      const result = validateOrgAccess(wrongTypeToken, requestedOrg);

      // ASSERT
      expect(result).toBe(false);
    });

    it('should_return_false_for_token_without_orgName', () => {
      // ARRANGE
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const tokenWithoutOrg = createMockJWT({
        type: 'github_org',
        // Missing username
        exp: futureExp,
      });
      const requestedOrg = 'test-org';

      // ACT
      const result = validateOrgAccess(tokenWithoutOrg, requestedOrg);

      // ASSERT
      expect(result).toBe(false);
    });
  });

  // ========================================================================
  // TEST: extractOrgFromPath
  // ========================================================================
  describe('extractOrgFromPath', () => {
    it('should_extract_org_from_basic_org_path', () => {
      // ARRANGE
      const pathname = '/org/test-org';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('test-org');
    });

    it('should_extract_org_from_deep_nested_path', () => {
      // ARRANGE
      const pathname = '/org/test-org/activity/daily';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('test-org');
    });

    it('should_extract_org_with_trailing_slash', () => {
      // ARRANGE
      const pathname = '/org/test-org/';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('test-org');
    });

    it('should_return_null_for_non_org_paths', () => {
      // ARRANGE
      const pathname = '/dashboard';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBeNull();
    });

    it('should_return_null_for_org_path_without_org_name', () => {
      // ARRANGE
      const pathname = '/org/';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBeNull();
    });

    it('should_return_null_for_empty_path', () => {
      // ARRANGE
      const pathname = '';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBeNull();
    });

    it('should_handle_org_names_with_hyphens', () => {
      // ARRANGE
      const pathname = '/org/my-awesome-org-name';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('my-awesome-org-name');
    });

    it('should_handle_org_names_with_numbers', () => {
      // ARRANGE
      const pathname = '/org/org123';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('org123');
    });

    it('should_extract_first_org_in_path', () => {
      // ARRANGE
      const pathname = '/org/first-org/something/org/second-org';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('first-org');
    });

    it('should_return_null_for_path_starting_with_different_segment', () => {
      // ARRANGE
      const pathname = '/dashboard/org/test-org';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBeNull();
    });

    it('should_handle_org_names_with_underscores', () => {
      // ARRANGE
      const pathname = '/org/my_org_name';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('my_org_name');
    });

    it('should_extract_org_from_complex_path', () => {
      // ARRANGE
      const pathname = '/org/test-org/standup/2025-01-15';

      // ACT
      const result = extractOrgFromPath(pathname);

      // ASSERT
      expect(result).toBe('test-org');
    });
  });
});

