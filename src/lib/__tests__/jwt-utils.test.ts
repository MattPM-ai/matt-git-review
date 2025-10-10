/**
 * ============================================================================
 * TEST SUITE: JWT Utilities
 * ============================================================================
 * 
 * MODULE UNDER TEST: jwt-utils
 * TEST TYPE: Unit
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-10
 * LAST MODIFIED: 2025-10-10
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for JWT utility functions including token decoding,
 * GitHub org JWT validation, and organization access verification.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - jwt-utils: Target module with JWT manipulation functions
 * 
 * COVERAGE SCOPE:
 * ✓ decodeJWTPayload - JWT token decoding without verification
 * ✓ validateGitHubOrgJWT - GitHub organization JWT validation
 * ✓ hasOrgAccess - Organization access verification
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js test environment
 * - Prerequisites: None (pure functions, no external dependencies)
 * - Runtime: <100ms
 * 
 * ============================================================================
 */

import { describe, it, expect } from 'vitest';
import { 
  decodeJWTPayload, 
  validateGitHubOrgJWT, 
  hasOrgAccess 
} from '../jwt-utils';
import { createMockJWT } from '@/test/utils/test-utils';

describe('JWT Utilities', () => {
  // ========================================================================
  // TEST: decodeJWTPayload
  // ========================================================================
  describe('decodeJWTPayload', () => {
    it('should_successfully_decode_valid_JWT_token_with_all_parts', () => {
      // ARRANGE: Create a valid JWT token
      const payload = {
        sub: 'user-123',
        name: 'Test User',
        type: 'github_org',
        username: 'test-org',
      };
      const token = createMockJWT(payload);

      // ACT: Decode the token
      const result = decodeJWTPayload(token);

      // ASSERT: Verify successful decoding
      expect(result.isValid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.sub).toBe('user-123');
      expect(result.payload?.name).toBe('Test User');
      expect(result.payload?.type).toBe('github_org');
      expect(result.payload?.username).toBe('test-org');
      expect(result.error).toBeUndefined();
    });

    it('should_return_invalid_for_malformed_JWT_with_only_one_part', () => {
      // ARRANGE: Create malformed token with only one part
      const token = 'single-part-token';

      // ACT: Attempt to decode
      const result = decodeJWTPayload(token);

      // ASSERT: Verify rejection with proper error
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JWT format');
      expect(result.payload).toBeUndefined();
    });

    it('should_return_invalid_for_malformed_JWT_with_two_parts', () => {
      // ARRANGE: Create malformed token with two parts
      const token = 'part1.part2';

      // ACT: Attempt to decode
      const result = decodeJWTPayload(token);

      // ASSERT: Verify rejection
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JWT format');
      expect(result.payload).toBeUndefined();
    });

    it('should_return_invalid_for_malformed_JWT_with_four_parts', () => {
      // ARRANGE: Create malformed token with four parts
      const token = 'part1.part2.part3.part4';

      // ACT: Attempt to decode
      const result = decodeJWTPayload(token);

      // ASSERT: Verify rejection
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JWT format');
      expect(result.payload).toBeUndefined();
    });

    it('should_return_invalid_for_JWT_with_invalid_base64_encoding', () => {
      // ARRANGE: Create token with invalid base64 in payload
      const token = 'eyJhbGciOiJIUzI1NiJ9.invalid-base64-!!@#$.signature';

      // ACT: Attempt to decode
      const result = decodeJWTPayload(token);

      // ASSERT: Verify rejection
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Failed to decode JWT token');
      expect(result.payload).toBeUndefined();
    });

    it('should_handle_JWT_with_special_characters_in_payload', () => {
      // ARRANGE: Create token with special characters (ASCII only due to atob limitations)
      const payload = {
        name: 'User with "quotes" and \\slashes\\',
        description: 'Special chars: @#$%^&*()',
        email: 'test+alias@example.com',
      };
      const token = createMockJWT(payload);

      // ACT: Decode the token
      const result = decodeJWTPayload(token);

      // ASSERT: Verify special characters are preserved
      expect(result.isValid).toBe(true);
      expect(result.payload?.name).toBe('User with "quotes" and \\slashes\\');
      expect(result.payload?.description).toBe('Special chars: @#$%^&*()');
      expect(result.payload?.email).toBe('test+alias@example.com');
    });

    it('should_return_invalid_for_empty_string_input', () => {
      // ARRANGE: Empty string token
      const token = '';

      // ACT: Attempt to decode
      const result = decodeJWTPayload(token);

      // ASSERT: Verify rejection
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JWT format');
    });
  });

  // ========================================================================
  // TEST: validateGitHubOrgJWT
  // ========================================================================
  describe('validateGitHubOrgJWT', () => {
    it('should_validate_token_with_correct_github_org_type', () => {
      // ARRANGE: Create valid GitHub org token
      const payload = {
        type: 'github_org',
        username: 'test-organization',
        sub: 'user-123',
        name: 'Test User',
      };
      const token = createMockJWT(payload);

      // ACT: Validate the token
      const result = validateGitHubOrgJWT(token);

      // ASSERT: Verify successful validation
      expect(result.isValid).toBe(true);
      expect(result.orgName).toBe('test-organization');
      expect(result.payload).toBeDefined();
      expect(result.payload?.username).toBe('test-organization');
      expect(result.error).toBeUndefined();
    });

    it('should_reject_token_with_wrong_type_field', () => {
      // ARRANGE: Create token with wrong type
      const payload = {
        type: 'github_user',
        username: 'test-organization',
        sub: 'user-123',
      };
      const token = createMockJWT(payload);

      // ACT: Validate the token
      const result = validateGitHubOrgJWT(token);

      // ASSERT: Verify rejection with appropriate error
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token type must be github_org');
      expect(result.orgName).toBeUndefined();
    });

    it('should_reject_token_missing_username_field', () => {
      // ARRANGE: Create token without username
      const payload = {
        type: 'github_org',
        sub: 'user-123',
        name: 'Test User',
      };
      const token = createMockJWT(payload);

      // ACT: Validate the token
      const result = validateGitHubOrgJWT(token);

      // ASSERT: Verify rejection
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token must contain organization name in username field');
      expect(result.orgName).toBeUndefined();
    });

    it('should_return_orgName_from_username_field_for_valid_token', () => {
      // ARRANGE: Create valid token with specific org name
      const payload = {
        type: 'github_org',
        username: 'my-awesome-org',
      };
      const token = createMockJWT(payload);

      // ACT: Validate the token
      const result = validateGitHubOrgJWT(token);

      // ASSERT: Verify org name extraction
      expect(result.isValid).toBe(true);
      expect(result.orgName).toBe('my-awesome-org');
    });

    it('should_reject_token_with_github_org_type_but_empty_username', () => {
      // ARRANGE: Create token with empty username
      const payload = {
        type: 'github_org',
        username: '',
      };
      const token = createMockJWT(payload);

      // ACT: Validate the token
      const result = validateGitHubOrgJWT(token);

      // ASSERT: Verify rejection (empty string is falsy)
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token must contain organization name in username field');
    });

    it('should_pass_through_decoding_errors_from_decodeJWTPayload', () => {
      // ARRANGE: Create malformed token
      const token = 'malformed-token';

      // ACT: Validate the token
      const result = validateGitHubOrgJWT(token);

      // ASSERT: Verify error is passed through
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid JWT format');
      expect(result.orgName).toBeUndefined();
    });

    it('should_handle_token_with_null_username', () => {
      // ARRANGE: Create token with null username
      const payload = {
        type: 'github_org',
        username: null,
      };
      const token = createMockJWT(payload);

      // ACT: Validate the token
      const result = validateGitHubOrgJWT(token);

      // ASSERT: Verify rejection
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token must contain organization name in username field');
    });
  });

  // ========================================================================
  // TEST: hasOrgAccess
  // ========================================================================
  describe('hasOrgAccess', () => {
    it('should_return_true_when_token_org_matches_required_org_exact_match', () => {
      // ARRANGE: Create token with specific org
      const payload = {
        type: 'github_org',
        username: 'test-org',
      };
      const token = createMockJWT(payload);
      const requiredOrg = 'test-org';

      // ACT: Check org access
      const result = hasOrgAccess(token, requiredOrg);

      // ASSERT: Verify access granted
      expect(result).toBe(true);
    });

    it('should_return_true_with_case_insensitive_matching', () => {
      // ARRANGE: Create token with lowercase org
      const payload = {
        type: 'github_org',
        username: 'test-org',
      };
      const token = createMockJWT(payload);
      const requiredOrg = 'TEST-ORG';

      // ACT: Check org access with different case
      const result = hasOrgAccess(token, requiredOrg);

      // ASSERT: Verify case-insensitive match succeeds
      expect(result).toBe(true);
    });

    it('should_return_true_with_mixed_case_variations', () => {
      // ARRANGE: Create token with mixed case
      const payload = {
        type: 'github_org',
        username: 'MyAwesomeOrg',
      };
      const token = createMockJWT(payload);
      const requiredOrg = 'myawesomeorg';

      // ACT: Check org access
      const result = hasOrgAccess(token, requiredOrg);

      // ASSERT: Verify match
      expect(result).toBe(true);
    });

    it('should_return_false_when_token_org_does_not_match_required_org', () => {
      // ARRANGE: Create token with different org
      const payload = {
        type: 'github_org',
        username: 'org-a',
      };
      const token = createMockJWT(payload);
      const requiredOrg = 'org-b';

      // ACT: Check org access
      const result = hasOrgAccess(token, requiredOrg);

      // ASSERT: Verify access denied
      expect(result).toBe(false);
    });

    it('should_return_false_for_invalid_tokens', () => {
      // ARRANGE: Create malformed token
      const token = 'invalid-token';
      const requiredOrg = 'test-org';

      // ACT: Check org access
      const result = hasOrgAccess(token, requiredOrg);

      // ASSERT: Verify access denied for invalid token
      expect(result).toBe(false);
    });

    it('should_return_false_for_tokens_with_wrong_type', () => {
      // ARRANGE: Create token with wrong type
      const payload = {
        type: 'github_user',
        username: 'test-org',
      };
      const token = createMockJWT(payload);
      const requiredOrg = 'test-org';

      // ACT: Check org access
      const result = hasOrgAccess(token, requiredOrg);

      // ASSERT: Verify access denied despite matching org name
      expect(result).toBe(false);
    });

    it('should_return_false_for_tokens_missing_orgName', () => {
      // ARRANGE: Create token without username
      const payload = {
        type: 'github_org',
      };
      const token = createMockJWT(payload);
      const requiredOrg = 'test-org';

      // ACT: Check org access
      const result = hasOrgAccess(token, requiredOrg);

      // ASSERT: Verify access denied
      expect(result).toBe(false);
    });
  });
});

