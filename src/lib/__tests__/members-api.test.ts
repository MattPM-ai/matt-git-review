/**
 * ============================================================================
 * TEST SUITE: Members API Client
 * ============================================================================
 * 
 * MODULE UNDER TEST: members-api
 * TEST TYPE: Integration
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-13
 * LAST MODIFIED: 2025-10-13
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the Members API client which handles
 * organization member management and email subscription operations.
 * Tests cover all CRUD operations with proper authorization.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - msw: ^2.11.5 - API mocking
 * - members-api: Target module with API client functions
 * 
 * COVERAGE SCOPE:
 * ✓ getOrgMembers - Fetch organization members
 * ✓ getExternalSubscriptions - Fetch external subscriptions
 * ✓ updateSubscription - Update subscription settings
 * ✓ getSubscription - Fetch single subscription
 * ✓ deleteSubscription - Delete subscription
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js with jsdom
 * - Prerequisites: MSW server running
 * - Runtime: <200ms
 * 
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOrgMembers,
  getExternalSubscriptions,
  updateSubscription,
  getSubscription,
  deleteSubscription,
  type MembersResponse,
  type ExternalSubscription,
} from '../members-api';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockJWT } from '@/test/utils/test-utils';

const MATT_API_BASE = 'https://api.test.mattpm.ai';

// Helper to create valid JWT
function createValidJWT(): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  return createMockJWT({
    sub: 'user-123',
    exp: futureExp,
    iat: Math.floor(Date.now() / 1000),
  });
}

describe('Members API Client', () => {
  const validJWT = createValidJWT();

  beforeEach(() => {
    server.resetHandlers();
  });

  // ========================================================================
  // TEST: getOrgMembers
  // ========================================================================

  describe('getOrgMembers', () => {
    it('should_fetch_members_successfully_with_valid_JWT', async () => {
      // ARRANGE
      const mockResponse: MembersResponse = {
        organization: {
          id: 'org-123',
          login: 'test-org',
          name: 'Test Organization',
          initialSetupAt: '2025-01-01T00:00:00Z',
        },
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            username: 'testuser',
            name: 'Test User',
            email: 'test@test.com',
            avatarUrl: 'https://avatar.test/user.png',
            role: 'member',
            joinedAt: '2025-01-01T00:00:00Z',
            subscription: null,
          },
        ],
      };

      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/members`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // ACT
      const result = await getOrgMembers('test-org', validJWT);

      // ASSERT
      expect(result).toEqual(mockResponse);
      expect(result.members).toHaveLength(1);
      expect(result.organization.login).toBe('test-org');
    });

    it('should_include_Authorization_header_with_Bearer_token', async () => {
      // ARRANGE
      let authHeader: string | null = null;

      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/members`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({ organization: {}, members: [] });
        })
      );

      // ACT
      await getOrgMembers('test-org', validJWT);

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
    });

    it('should_throw_error_on_401_unauthorized', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/members`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      // ACT & ASSERT
      await expect(getOrgMembers('test-org', validJWT)).rejects.toThrow(
        'Failed to fetch organization members'
      );
    });

    it('should_throw_error_on_404_not_found', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/organizations/nonexistent/members`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      // ACT & ASSERT
      await expect(getOrgMembers('nonexistent', validJWT)).rejects.toThrow(
        'Failed to fetch organization members'
      );
    });

    it('should_throw_error_on_500_server_error', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/members`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // ACT & ASSERT
      await expect(getOrgMembers('test-org', validJWT)).rejects.toThrow(
        'Failed to fetch organization members'
      );
    });

    it('should_return_correctly_typed_response', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/members`, () => {
          return HttpResponse.json({
            organization: {
              id: 'org-123',
              login: 'test-org',
              name: 'Test Org',
              initialSetupAt: '2025-01-01T00:00:00Z',
            },
            members: [],
          });
        })
      );

      // ACT
      const result = await getOrgMembers('test-org', validJWT);

      // ASSERT
      expect(result).toHaveProperty('organization');
      expect(result).toHaveProperty('members');
      expect(Array.isArray(result.members)).toBe(true);
    });

    it('should_call_correct_endpoint_with_orgLogin', async () => {
      // ARRANGE
      let requestUrl = '';

      server.use(
        http.get(`${MATT_API_BASE}/organizations/:orgLogin/members`, ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json({ organization: {}, members: [] });
        })
      );

      // ACT
      await getOrgMembers('my-custom-org', validJWT);

      // ASSERT
      expect(requestUrl).toContain('/organizations/my-custom-org/members');
    });

    it('should_handle_members_with_subscriptions', async () => {
      // ARRANGE
      const mockResponse: MembersResponse = {
        organization: {
          id: 'org-123',
          login: 'test-org',
          name: 'Test Org',
          initialSetupAt: '2025-01-01T00:00:00Z',
        },
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            username: 'testuser',
            name: 'Test User',
            email: 'test@test.com',
            avatarUrl: 'https://avatar.test/user.png',
            role: 'member',
            joinedAt: '2025-01-01T00:00:00Z',
            subscription: {
              id: 'sub-1',
              email: 'test@test.com',
              dailyReport: true,
              weeklyReport: false,
              monthlyReport: false,
              isAutoCreated: true,
              externallyManaged: false,
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
            },
          },
        ],
      };

      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/members`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // ACT
      const result = await getOrgMembers('test-org', validJWT);

      // ASSERT
      expect(result.members[0].subscription).not.toBeNull();
      expect(result.members[0].subscription?.dailyReport).toBe(true);
    });
  });

  // ========================================================================
  // TEST: getExternalSubscriptions
  // ========================================================================

  describe('getExternalSubscriptions', () => {
    it('should_fetch_external_subscriptions_with_query_parameter', async () => {
      // ARRANGE
      let requestUrl = '';
      const mockSubscriptions: ExternalSubscription[] = [
        {
          id: 'sub-1',
          email: 'external@test.com',
          github_org_id: 'org-123',
          inviter_github_user_id: 'user-123',
          daily_report: true,
          weekly_report: true,
          monthly_report: false,
          is_auto_created: false,
          externally_managed: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
          deleted_at: null,
        },
      ];

      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/organization/:orgLogin`, ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json(mockSubscriptions);
        })
      );

      // ACT
      const result = await getExternalSubscriptions('test-org', validJWT);

      // ASSERT
      expect(requestUrl).toContain('external=true');
      expect(result).toEqual(mockSubscriptions);
    });

    it('should_include_Authorization_header', async () => {
      // ARRANGE
      let authHeader: string | null = null;

      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/organization/:orgLogin`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json([]);
        })
      );

      // ACT
      await getExternalSubscriptions('test-org', validJWT);

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
    });

    it('should_throw_error_on_non_OK_response', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/organization/:orgLogin`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      // ACT & ASSERT
      await expect(getExternalSubscriptions('test-org', validJWT)).rejects.toThrow(
        'Failed to fetch external subscriptions'
      );
    });

    it('should_return_array_of_subscriptions', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/organization/:orgLogin`, () => {
          return HttpResponse.json([
            {
              id: 'sub-1',
              email: 'test1@test.com',
              github_org_id: 'org-123',
              inviter_github_user_id: 'user-123',
              daily_report: true,
              weekly_report: false,
              monthly_report: false,
              is_auto_created: false,
              externally_managed: true,
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
              deleted_at: null,
            },
          ]);
        })
      );

      // ACT
      const result = await getExternalSubscriptions('test-org', validJWT);

      // ASSERT
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should_handle_empty_array_response', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/organization/:orgLogin`, () => {
          return HttpResponse.json([]);
        })
      );

      // ACT
      const result = await getExternalSubscriptions('test-org', validJWT);

      // ASSERT
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  // ========================================================================
  // TEST: updateSubscription
  // ========================================================================

  describe('updateSubscription', () => {
    it('should_update_subscription_with_PUT_request', async () => {
      // ARRANGE
      let requestMethod = '';

      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, ({ request }) => {
          requestMethod = request.method;
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT
      await updateSubscription(
        'sub-123',
        { dailyReport: true, weeklyReport: false, monthlyReport: true },
        validJWT
      );

      // ASSERT
      expect(requestMethod).toBe('PUT');
    });

    it('should_include_Authorization_and_Content_Type_headers', async () => {
      // ARRANGE
      let authHeader: string | null = null;
      let contentType: string | null = null;

      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          contentType = request.headers.get('Content-Type');
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT
      await updateSubscription(
        'sub-123',
        { dailyReport: true, weeklyReport: false, monthlyReport: true },
        validJWT
      );

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
      expect(contentType).toBe('application/json');
    });

    it('should_send_correct_request_body', async () => {
      // ARRANGE
      let requestBody: unknown = null;

      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, async ({ request }) => {
          requestBody = await request.json();
          return new HttpResponse(null, { status: 200 });
        })
      );

      const params = { dailyReport: true, weeklyReport: false, monthlyReport: true };

      // ACT
      await updateSubscription('sub-123', params, validJWT);

      // ASSERT
      expect(requestBody).toEqual(params);
    });

    it('should_throw_error_on_401_unauthorized', async () => {
      // ARRANGE
      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      // ACT & ASSERT
      await expect(
        updateSubscription('sub-123', { dailyReport: true, weeklyReport: false, monthlyReport: false }, validJWT)
      ).rejects.toThrow('Failed to update subscription');
    });

    it('should_throw_error_on_404_not_found', async () => {
      // ARRANGE
      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      // ACT & ASSERT
      await expect(
        updateSubscription('nonexistent', { dailyReport: true, weeklyReport: false, monthlyReport: false }, validJWT)
      ).rejects.toThrow('Failed to update subscription');
    });

    it('should_throw_error_on_500_server_error', async () => {
      // ARRANGE
      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // ACT & ASSERT
      await expect(
        updateSubscription('sub-123', { dailyReport: true, weeklyReport: false, monthlyReport: false }, validJWT)
      ).rejects.toThrow('Failed to update subscription');
    });

    it('should_complete_successfully_on_200_response', async () => {
      // ARRANGE
      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT & ASSERT
      await expect(
        updateSubscription('sub-123', { dailyReport: false, weeklyReport: true, monthlyReport: false }, validJWT)
      ).resolves.toBeUndefined();
    });

    it('should_use_correct_subscription_ID_in_URL', async () => {
      // ARRANGE
      let requestUrl = '';

      server.use(
        http.put(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, ({ request }) => {
          requestUrl = request.url;
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT
      await updateSubscription('custom-sub-456', { dailyReport: true, weeklyReport: false, monthlyReport: false }, validJWT);

      // ASSERT
      expect(requestUrl).toContain('/email-subscriptions/custom-sub-456');
    });
  });

  // ========================================================================
  // TEST: getSubscription
  // ========================================================================

  describe('getSubscription', () => {
    it('should_fetch_single_subscription_by_ID', async () => {
      // ARRANGE
      const mockSubscription: ExternalSubscription = {
        id: 'sub-123',
        email: 'test@test.com',
        github_org_id: 'org-123',
        inviter_github_user_id: 'user-123',
        daily_report: true,
        weekly_report: false,
        monthly_report: false,
        is_auto_created: false,
        externally_managed: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        deleted_at: null,
      };

      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json(mockSubscription);
        })
      );

      // ACT
      const result = await getSubscription('sub-123', validJWT);

      // ASSERT
      expect(result).toEqual(mockSubscription);
      expect(result.id).toBe('sub-123');
    });

    it('should_include_Authorization_header', async () => {
      // ARRANGE
      let authHeader: string | null = null;

      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({} as ExternalSubscription);
        })
      );

      // ACT
      await getSubscription('sub-123', validJWT);

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
    });

    it('should_throw_error_on_non_OK_response', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      // ACT & ASSERT
      await expect(getSubscription('nonexistent', validJWT)).rejects.toThrow(
        'Failed to fetch subscription'
      );
    });

    it('should_return_correctly_typed_subscription', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({
            id: 'sub-123',
            email: 'test@test.com',
            github_org_id: 'org-123',
            inviter_github_user_id: 'user-123',
            daily_report: true,
            weekly_report: false,
            monthly_report: false,
            is_auto_created: false,
            externally_managed: true,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            deleted_at: null,
          });
        })
      );

      // ACT
      const result = await getSubscription('sub-123', validJWT);

      // ASSERT
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('daily_report');
    });
  });

  // ========================================================================
  // TEST: deleteSubscription
  // ========================================================================

  describe('deleteSubscription', () => {
    it('should_delete_subscription_with_DELETE_request', async () => {
      // ARRANGE
      let requestMethod = '';

      server.use(
        http.delete(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, ({ request }) => {
          requestMethod = request.method;
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT
      await deleteSubscription('sub-123', validJWT);

      // ASSERT
      expect(requestMethod).toBe('DELETE');
    });

    it('should_include_Authorization_header', async () => {
      // ARRANGE
      let authHeader: string | null = null;

      server.use(
        http.delete(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT
      await deleteSubscription('sub-123', validJWT);

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
    });

    it('should_throw_error_on_non_OK_response', async () => {
      // ARRANGE
      server.use(
        http.delete(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      // ACT & ASSERT
      await expect(deleteSubscription('sub-123', validJWT)).rejects.toThrow(
        'Failed to delete subscription'
      );
    });

    it('should_complete_successfully_on_200_response', async () => {
      // ARRANGE
      server.use(
        http.delete(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT & ASSERT
      await expect(deleteSubscription('sub-123', validJWT)).resolves.toBeUndefined();
    });

    it('should_handle_404_for_already_deleted_subscription', async () => {
      // ARRANGE
      server.use(
        http.delete(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      // ACT & ASSERT
      await expect(deleteSubscription('nonexistent', validJWT)).rejects.toThrow(
        'Failed to delete subscription'
      );
    });

    it('should_use_correct_subscription_ID_in_URL', async () => {
      // ARRANGE
      let requestUrl = '';

      server.use(
        http.delete(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, ({ request }) => {
          requestUrl = request.url;
          return new HttpResponse(null, { status: 200 });
        })
      );

      // ACT
      await deleteSubscription('custom-sub-789', validJWT);

      // ASSERT
      expect(requestUrl).toContain('/email-subscriptions/custom-sub-789');
    });

    it('should_throw_error_on_500_server_error', async () => {
      // ARRANGE
      server.use(
        http.delete(`${MATT_API_BASE}/email-subscriptions/:subscriptionId`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // ACT & ASSERT
      await expect(deleteSubscription('sub-123', validJWT)).rejects.toThrow(
        'Failed to delete subscription'
      );
    });
  });
});


