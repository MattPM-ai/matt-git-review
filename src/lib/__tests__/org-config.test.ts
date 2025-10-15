/**
 * ============================================================================
 * TEST SUITE: Organization Config API Client
 * ============================================================================
 * 
 * MODULE UNDER TEST: org-config
 * TEST TYPE: Integration
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-13
 * LAST MODIFIED: 2025-10-13
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the Organization Config API client which
 * handles fetching and updating organization settings including timezone,
 * country, email preferences, and report configurations.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - msw: ^2.11.5 - API mocking
 * - org-config: Target module with config management functions
 * 
 * COVERAGE SCOPE:
 * ✓ getOrgConfig - Fetch organization configuration
 * ✓ updateOrgConfig - Update organization settings
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js with jsdom
 * - Prerequisites: MSW server running
 * - Runtime: <100ms
 * 
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getOrgConfig, updateOrgConfig, type OrgConfig, type UpdateOrgConfigParams } from '../org-config';
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

describe('Organization Config API Client', () => {
  const validJWT = createValidJWT();

  beforeEach(() => {
    server.resetHandlers();
  });

  // ========================================================================
  // TEST: getOrgConfig
  // ========================================================================

  describe('getOrgConfig', () => {
    it('should_fetch_config_successfully_with_valid_JWT', async () => {
      // ARRANGE
      const mockConfig: OrgConfig = {
        id: 'org-123',
        login: 'test-org',
        name: 'Test Organization',
        initialSetupAt: '2025-01-01T00:00:00Z',
        country: 'US',
        timezone: 'America/New_York',
        preferredEmailTime: '09:00',
        dailyReport: true,
        weeklyReport: true,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json(mockConfig);
        })
      );

      // ACT
      const result = await getOrgConfig('test-org', validJWT);

      // ASSERT
      expect(result).toEqual(mockConfig);
      expect(result.login).toBe('test-org');
    });

    it('should_include_Authorization_header_with_Bearer_token', async () => {
      // ARRANGE
      let authHeader: string | null = null;

      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/config`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({} as OrgConfig);
        })
      );

      // ACT
      await getOrgConfig('test-org', validJWT);

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
    });

    it('should_throw_error_on_401_unauthorized', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      // ACT & ASSERT
      await expect(getOrgConfig('test-org', validJWT)).rejects.toThrow(
        'Failed to fetch organization config'
      );
    });

    it('should_throw_error_on_404_not_found', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/organizations/nonexistent/config`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      // ACT & ASSERT
      await expect(getOrgConfig('nonexistent', validJWT)).rejects.toThrow(
        'Failed to fetch organization config'
      );
    });

    it('should_throw_error_on_500_server_error', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // ACT & ASSERT
      await expect(getOrgConfig('test-org', validJWT)).rejects.toThrow(
        'Failed to fetch organization config'
      );
    });

    it('should_return_correctly_typed_OrgConfig', async () => {
      // ARRANGE
      const mockConfig: OrgConfig = {
        id: 'org-123',
        login: 'test-org',
        name: 'Test Org',
        initialSetupAt: '2025-01-01T00:00:00Z',
        country: 'US',
        timezone: 'America/New_York',
        preferredEmailTime: '09:00',
        dailyReport: true,
        weeklyReport: false,
        monthlyReport: true,
        sendEmptyWeekdayReports: false,
      };

      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json(mockConfig);
        })
      );

      // ACT
      const result = await getOrgConfig('test-org', validJWT);

      // ASSERT
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('login');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('timezone');
      expect(result).toHaveProperty('preferredEmailTime');
      expect(result).toHaveProperty('dailyReport');
      expect(result).toHaveProperty('weeklyReport');
      expect(result).toHaveProperty('monthlyReport');
      expect(result).toHaveProperty('sendEmptyWeekdayReports');
    });

    it('should_handle_null_values_in_config', async () => {
      // ARRANGE
      const mockConfig: OrgConfig = {
        id: 'org-123',
        login: 'test-org',
        name: 'Test Org',
        initialSetupAt: null,
        country: null,
        timezone: null,
        preferredEmailTime: null,
        dailyReport: false,
        weeklyReport: false,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      server.use(
        http.get(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json(mockConfig);
        })
      );

      // ACT
      const result = await getOrgConfig('test-org', validJWT);

      // ASSERT
      expect(result.country).toBeNull();
      expect(result.timezone).toBeNull();
      expect(result.preferredEmailTime).toBeNull();
    });

    it('should_call_correct_endpoint_with_orgLogin', async () => {
      // ARRANGE
      let requestUrl = '';

      server.use(
        http.get(`${MATT_API_BASE}/organizations/:orgLogin/config`, ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json({} as OrgConfig);
        })
      );

      // ACT
      await getOrgConfig('my-custom-org', validJWT);

      // ASSERT
      expect(requestUrl).toContain('/organizations/my-custom-org/config');
    });
  });

  // ========================================================================
  // TEST: updateOrgConfig
  // ========================================================================

  describe('updateOrgConfig', () => {
    it('should_update_config_with_PUT_request', async () => {
      // ARRANGE
      let requestMethod = '';
      const mockUpdatedConfig: OrgConfig = {
        id: 'org-123',
        login: 'test-org',
        name: 'Test Org',
        initialSetupAt: '2025-01-01T00:00:00Z',
        country: 'CA',
        timezone: 'America/Toronto',
        preferredEmailTime: '10:00',
        dailyReport: false,
        weeklyReport: true,
        monthlyReport: true,
        sendEmptyWeekdayReports: true,
      };

      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, ({ request }) => {
          requestMethod = request.method;
          return HttpResponse.json(mockUpdatedConfig);
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'CA',
        timezone: 'America/Toronto',
        preferredEmailTime: '10:00',
        dailyReport: false,
        weeklyReport: true,
        monthlyReport: true,
        sendEmptyWeekdayReports: true,
      };

      // ACT
      await updateOrgConfig('test-org', updateParams, validJWT);

      // ASSERT
      expect(requestMethod).toBe('PUT');
    });

    it('should_include_Authorization_and_Content_Type_headers', async () => {
      // ARRANGE
      let authHeader: string | null = null;
      let contentType: string | null = null;

      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          contentType = request.headers.get('Content-Type');
          return HttpResponse.json({} as OrgConfig);
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'US',
        timezone: 'America/New_York',
        preferredEmailTime: '09:00',
        dailyReport: true,
        weeklyReport: false,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      // ACT
      await updateOrgConfig('test-org', updateParams, validJWT);

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
      expect(contentType).toBe('application/json');
    });

    it('should_send_all_config_params_in_request_body', async () => {
      // ARRANGE
      let requestBody: unknown = null;

      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({} as OrgConfig);
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'UK',
        timezone: 'Europe/London',
        preferredEmailTime: '08:00',
        dailyReport: true,
        weeklyReport: true,
        monthlyReport: true,
        sendEmptyWeekdayReports: true,
      };

      // ACT
      await updateOrgConfig('test-org', updateParams, validJWT);

      // ASSERT
      const body = requestBody as Record<string, unknown>;
      expect(requestBody).toEqual(updateParams);
      expect(body.country).toBe('UK');
      expect(body.timezone).toBe('Europe/London');
      expect(body.preferredEmailTime).toBe('08:00');
      expect(body.dailyReport).toBe(true);
      expect(body.weeklyReport).toBe(true);
      expect(body.monthlyReport).toBe(true);
      expect(body.sendEmptyWeekdayReports).toBe(true);
    });

    it('should_return_updated_OrgConfig', async () => {
      // ARRANGE
      const updatedConfig: OrgConfig = {
        id: 'org-123',
        login: 'test-org',
        name: 'Test Org',
        initialSetupAt: '2025-01-01T00:00:00Z',
        country: 'FR',
        timezone: 'Europe/Paris',
        preferredEmailTime: '11:00',
        dailyReport: false,
        weeklyReport: false,
        monthlyReport: true,
        sendEmptyWeekdayReports: false,
      };

      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json(updatedConfig);
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'FR',
        timezone: 'Europe/Paris',
        preferredEmailTime: '11:00',
        dailyReport: false,
        weeklyReport: false,
        monthlyReport: true,
        sendEmptyWeekdayReports: false,
      };

      // ACT
      const result = await updateOrgConfig('test-org', updateParams, validJWT);

      // ASSERT
      expect(result).toEqual(updatedConfig);
      expect(result.country).toBe('FR');
      expect(result.timezone).toBe('Europe/Paris');
    });

    it('should_throw_error_on_401_unauthorized', async () => {
      // ARRANGE
      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'US',
        timezone: 'America/New_York',
        preferredEmailTime: '09:00',
        dailyReport: true,
        weeklyReport: false,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      // ACT & ASSERT
      await expect(updateOrgConfig('test-org', updateParams, validJWT)).rejects.toThrow(
        'Failed to update organization config'
      );
    });

    it('should_throw_error_on_validation_failure', async () => {
      // ARRANGE
      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json({ error: 'Invalid timezone' }, { status: 400 });
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'US',
        timezone: 'Invalid/Timezone',
        preferredEmailTime: '09:00',
        dailyReport: true,
        weeklyReport: false,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      // ACT & ASSERT
      await expect(updateOrgConfig('test-org', updateParams, validJWT)).rejects.toThrow(
        'Failed to update organization config'
      );
    });

    it('should_throw_error_on_500_server_error', async () => {
      // ARRANGE
      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'US',
        timezone: 'America/New_York',
        preferredEmailTime: '09:00',
        dailyReport: true,
        weeklyReport: false,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      // ACT & ASSERT
      await expect(updateOrgConfig('test-org', updateParams, validJWT)).rejects.toThrow(
        'Failed to update organization config'
      );
    });

    it('should_use_correct_orgLogin_in_URL', async () => {
      // ARRANGE
      let requestUrl = '';

      server.use(
        http.put(`${MATT_API_BASE}/organizations/:orgLogin/config`, ({ request }) => {
          requestUrl = request.url;
          return HttpResponse.json({} as OrgConfig);
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'US',
        timezone: 'America/New_York',
        preferredEmailTime: '09:00',
        dailyReport: true,
        weeklyReport: false,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      // ACT
      await updateOrgConfig('my-special-org', updateParams, validJWT);

      // ASSERT
      expect(requestUrl).toContain('/organizations/my-special-org/config');
    });

    it('should_handle_boolean_flags_correctly', async () => {
      // ARRANGE
      let requestBody: unknown = null;

      server.use(
        http.put(`${MATT_API_BASE}/organizations/test-org/config`, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({} as OrgConfig);
        })
      );

      const updateParams: UpdateOrgConfigParams = {
        country: 'US',
        timezone: 'America/New_York',
        preferredEmailTime: '09:00',
        dailyReport: false,
        weeklyReport: false,
        monthlyReport: false,
        sendEmptyWeekdayReports: false,
      };

      // ACT
      await updateOrgConfig('test-org', updateParams, validJWT);

      // ASSERT
      const body = requestBody as Record<string, unknown>;
      expect(body.dailyReport).toBe(false);
      expect(body.weeklyReport).toBe(false);
      expect(body.monthlyReport).toBe(false);
      expect(body.sendEmptyWeekdayReports).toBe(false);
    });
  });
});


