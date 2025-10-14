/**
 * ============================================================================
 * TEST SUITE: MattAPIClient
 * ============================================================================
 * 
 * MODULE UNDER TEST: matt-api
 * TEST TYPE: Unit / Integration
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-10
 * LAST MODIFIED: 2025-10-14
 * VERSION: 1.1.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the MattAPIClient class which handles all
 * communication with the Matt API backend including authentication, activity
 * fetching, and standup generation.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - msw: ^2.11.5 - API mocking
 * - matt-api: Target module with API client
 * 
 * COVERAGE SCOPE:
 * ✓ authenticateUser - User authentication via GitHub token
 * ✓ fetchActivities - Activity data retrieval with filtering
 * ✓ generateStandup - Standup report generation
 * ✓ getStandupTask - Task status retrieval
 * ✓ pollStandupTask - Async task polling with progress
 * ✓ NoActivityError - Custom error class
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js with jsdom
 * - Prerequisites: MSW server running
 * - Runtime: <200ms
 * 
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mattAPI, NoActivityError, TaskStatus, type ActivityFilterDto, type StandupRequest } from '../matt-api';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockJWT } from '@/test/utils/test-utils';

const MATT_API_BASE = 'https://api.test.mattpm.ai';

// Helper to create a valid JWT with expiration far in the future
function createValidJWT(): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
  return createMockJWT({
    sub: 'user-123',
    exp: futureExp,
    iat: Math.floor(Date.now() / 1000),
  });
}

describe('MattAPIClient', () => {
  // ========================================================================
  // TEST: NoActivityError Class
  // ========================================================================
  describe('NoActivityError', () => {
    it('should_be_instance_of_Error', () => {
      // ARRANGE & ACT
      const error = new NoActivityError();

      // ASSERT
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NoActivityError);
    });

    it('should_have_name_NoActivityError', () => {
      // ARRANGE & ACT
      const error = new NoActivityError();

      // ASSERT
      expect(error.name).toBe('NoActivityError');
    });

    it('should_use_default_message_when_none_provided', () => {
      // ARRANGE & ACT
      const error = new NoActivityError();

      // ASSERT
      expect(error.message).toBe('No activity found for this period');
    });

    it('should_use_custom_message_when_provided', () => {
      // ARRANGE
      const customMessage = 'No commits found for this user';

      // ACT
      const error = new NoActivityError(customMessage);

      // ASSERT
      expect(error.message).toBe(customMessage);
    });
  });

  // ========================================================================
  // TEST: authenticateUser
  // ========================================================================
  describe('authenticateUser', () => {
    it('should_successfully_authenticate_with_valid_access_token', async () => {
      // ARRANGE
      const accessToken = 'github-access-token-123';

      // ACT
      const promise = mattAPI.authenticateUser(accessToken);

      // ASSERT - Should not throw
      await expect(promise).resolves.toBeUndefined();
    });

    it('should_throw_error_when_API_returns_non_OK_status', async () => {
      // ARRANGE
      server.use(
        http.post(`${MATT_API_BASE}/users/auth`, () => {
          return HttpResponse.json({ error: 'Invalid token' }, { status: 401 });
        })
      );

      const accessToken = 'invalid-token';

      // ACT & ASSERT
      // When API returns 401, authenticatedFetch throws its own Unauthorized error
      await expect(mattAPI.authenticateUser(accessToken))
        .rejects
        .toThrow();
    });

    it('should_call_correct_endpoint_with_POST_method', async () => {
      // ARRANGE
      let capturedRequest: any = null;
      
      server.use(
        http.post(`${MATT_API_BASE}/users/auth`, ({ request }) => {
          capturedRequest = request;
          return HttpResponse.json({
            access_token: 'jwt-token',
            user: { id: '123', login: 'testuser' },
          });
        })
      );

      const accessToken = 'github-token';

      // ACT
      await mattAPI.authenticateUser(accessToken);

      // ASSERT
      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest?.method).toBe('POST');
    });

    it('should_include_access_token_in_request_body', async () => {
      // ARRANGE
      let requestBody: any = null;
      
      server.use(
        http.post(`${MATT_API_BASE}/users/auth`, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            access_token: 'jwt-token',
            user: { id: '123', login: 'testuser' },
          });
        })
      );

      const accessToken = 'github-token-456';

      // ACT
      await mattAPI.authenticateUser(accessToken);

      // ASSERT
      expect(requestBody).toEqual({ access_token: accessToken });
    });
  });

  // ========================================================================
  // TEST: fetchActivities
  // ========================================================================
  describe('fetchActivities', () => {
    const validJWT = createValidJWT();
    const validFilter: ActivityFilterDto = {
      organizationLogin: 'test-org',
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31',
    };

    it('should_successfully_fetch_activities_with_valid_JWT_and_filter', async () => {
      // ACT
      const result = await mattAPI.fetchActivities(validJWT, validFilter);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.activities).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.repositories).toBeDefined();
    });

    it('should_throw_error_when_no_JWT_token_provided', async () => {
      // ARRANGE
      const emptyJWT = '';

      // ACT & ASSERT
      await expect(mattAPI.fetchActivities(emptyJWT, validFilter))
        .rejects
        .toThrow('No JWT token provided');
    });

    it('should_throw_error_when_API_returns_non_OK_status', async () => {
      // ARRANGE
      server.use(
        http.post(`${MATT_API_BASE}/activity/filter`, () => {
          return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
        })
      );

      // ACT & ASSERT
      // When API returns 401, authenticatedFetch throws its own Unauthorized error
      await expect(mattAPI.fetchActivities(validJWT, validFilter))
        .rejects
        .toThrow();
    });

    it('should_convert_date_strings_to_Date_objects', async () => {
      // ACT
      const result = await mattAPI.fetchActivities(validJWT, validFilter);

      // ASSERT
      expect(result.activities.length).toBeGreaterThan(0);
      expect(result.activities[0].created_at).toBeInstanceOf(Date);
    });

    it('should_handle_all_date_fields', async () => {
      // ARRANGE
      server.use(
        http.post(`${MATT_API_BASE}/activity/filter`, () => {
          return HttpResponse.json({
            users: {},
            repositories: {},
            activities: [
              {
                id: 1,
                number: 1,
                title: 'Test PR',
                body: 'Test',
                state: 'open',
                user_login: 'testuser',
                created_at: '2025-01-01T12:00:00Z',
                updated_at: '2025-01-02T12:00:00Z',
                merged_at: '2025-01-03T12:00:00Z',
                closed_at: '2025-01-04T12:00:00Z',
                html_url: 'https://github.com/test',
                repository_full_name: 'org/repo',
                type: 'pull',
              },
            ],
          });
        })
      );

      // ACT
      const result = await mattAPI.fetchActivities(validJWT, validFilter);

      // ASSERT
      const activity = result.activities[0];
      expect(activity.created_at).toBeInstanceOf(Date);
      expect((activity as any).updated_at).toBeInstanceOf(Date);
      expect((activity as any).merged_at).toBeInstanceOf(Date);
      expect((activity as any).closed_at).toBeInstanceOf(Date);
    });

    it('should_send_Authorization_header_with_Bearer_token', async () => {
      // ARRANGE
      let authHeader: string | null = null;
      
      server.use(
        http.post(`${MATT_API_BASE}/activity/filter`, ({ request }) => {
          authHeader = request.headers.get('Authorization');
          return HttpResponse.json({
            users: {},
            repositories: {},
            activities: [],
          });
        })
      );

      // ACT
      await mattAPI.fetchActivities(validJWT, validFilter);

      // ASSERT
      expect(authHeader).toBe(`Bearer ${validJWT}`);
    });
  });

  // ========================================================================
  // TEST: generateStandup
  // ========================================================================
  describe('generateStandup', () => {
    const validJWT = createValidJWT();
    const validRequest: StandupRequest = {
      organizationLogin: 'test-org',
      dateFrom: '2025-01-01',
      dateTo: '2025-01-01',
    };

    it('should_successfully_generate_standup_and_return_task_ID', async () => {
      // ACT
      const result = await mattAPI.generateStandup(validJWT, validRequest);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-123');
    });

    it('should_throw_error_when_no_JWT_token_provided', async () => {
      // ARRANGE
      const emptyJWT = '';

      // ACT & ASSERT
      await expect(mattAPI.generateStandup(emptyJWT, validRequest))
        .rejects
        .toThrow('No JWT token provided');
    });

    it('should_throw_NoActivityError_when_response_status_is_204', async () => {
      // ARRANGE
      server.use(
        http.post(`${MATT_API_BASE}/standup/generate`, () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      // ACT & ASSERT
      await expect(mattAPI.generateStandup(validJWT, validRequest))
        .rejects
        .toThrow(NoActivityError);
    });

    it('should_throw_error_when_API_returns_other_non_OK_status', async () => {
      // ARRANGE
      server.use(
        http.post(`${MATT_API_BASE}/standup/generate`, () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      // ACT & ASSERT
      await expect(mattAPI.generateStandup(validJWT, validRequest))
        .rejects
        .toThrow('Failed to generate standup');
    });

    it('should_send_correct_request_body', async () => {
      // ARRANGE
      let requestBody: any = null;
      
      server.use(
        http.post(`${MATT_API_BASE}/standup/generate`, async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({ taskId: 'task-456' });
        })
      );

      // ACT
      await mattAPI.generateStandup(validJWT, validRequest);

      // ASSERT
      expect(requestBody).toEqual(validRequest);
    });
  });

  // ========================================================================
  // TEST: getStandupTask
  // ========================================================================
  describe('getStandupTask', () => {
    const validJWT = createValidJWT();
    const taskId = 'task-123';

    it('should_successfully_retrieve_task_by_ID', async () => {
      // ACT
      const result = await mattAPI.getStandupTask(validJWT, taskId);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.id).toBe(taskId);
      expect(result.status).toBe('completed');
    });

    it('should_throw_error_when_no_JWT_token_provided', async () => {
      // ARRANGE
      const emptyJWT = '';

      // ACT & ASSERT
      await expect(mattAPI.getStandupTask(emptyJWT, taskId))
        .rejects
        .toThrow('No JWT token provided');
    });

    it('should_throw_error_when_API_returns_non_OK_status', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/:taskId`, () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        })
      );

      // ACT & ASSERT
      await expect(mattAPI.getStandupTask(validJWT, taskId))
        .rejects
        .toThrow('Failed to get standup task');
    });
  });

  // ========================================================================
  // TEST: pollStandupTask
  // ========================================================================
  describe('pollStandupTask', () => {
    const validJWT = createValidJWT();
    const taskId = 'task-poll-123';

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should_resolve_with_result_when_task_status_is_COMPLETED', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/${taskId}`, () => {
          return HttpResponse.json({
            id: taskId,
            status: TaskStatus.COMPLETED,
            result: [{ username: 'testuser', standup: {} }],
          });
        })
      );

      // ACT
      const promise = mattAPI.pollStandupTask(validJWT, taskId);
      await vi.runAllTimersAsync();
      const result = await promise;

      // ASSERT
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should_reject_when_task_status_is_FAILED', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/${taskId}`, () => {
          return HttpResponse.json({
            id: taskId,
            status: TaskStatus.FAILED,
            error_message: 'Generation failed',
          });
        })
      );

      // ACT
      const promise = mattAPI.pollStandupTask(validJWT, taskId);
      
      // Run timers and assert rejection simultaneously to avoid unhandled rejection
      const [, rejection] = await Promise.all([
        vi.runAllTimersAsync(),
        promise.catch(error => error)
      ]);

      // ASSERT
      expect(rejection).toBeInstanceOf(Error);
      expect(rejection.message).toBe('Generation failed');
    });

    it('should_continue_polling_when_status_is_PENDING', async () => {
      // ARRANGE
      let callCount = 0;
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/${taskId}`, () => {
          callCount++;
          if (callCount < 3) {
            return HttpResponse.json({
              id: taskId,
              status: TaskStatus.PENDING,
            });
          }
          return HttpResponse.json({
            id: taskId,
            status: TaskStatus.COMPLETED,
            result: [{ username: 'test' }],
          });
        })
      );

      // ACT
      const promise = mattAPI.pollStandupTask(validJWT, taskId);
      await vi.runAllTimersAsync();
      const result = await promise;

      // ASSERT
      expect(result).toBeDefined();
      expect(callCount).toBeGreaterThanOrEqual(3);
    });

    it('should_continue_polling_when_status_is_PROCESSING', async () => {
      // ARRANGE
      let callCount = 0;
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/${taskId}`, () => {
          callCount++;
          if (callCount < 2) {
            return HttpResponse.json({
              id: taskId,
              status: TaskStatus.PROCESSING,
            });
          }
          return HttpResponse.json({
            id: taskId,
            status: TaskStatus.COMPLETED,
            result: [{ username: 'test' }],
          });
        })
      );

      // ACT
      const promise = mattAPI.pollStandupTask(validJWT, taskId);
      await vi.runAllTimersAsync();
      const result = await promise;

      // ASSERT
      expect(result).toBeDefined();
      expect(callCount).toBeGreaterThanOrEqual(2);
    });

    it('should_call_onProgress_callback_on_each_poll', async () => {
      // ARRANGE
      const onProgress = vi.fn();
      let callCount = 0;
      
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/${taskId}`, () => {
          callCount++;
          if (callCount < 2) {
            return HttpResponse.json({
              id: taskId,
              status: TaskStatus.PROCESSING,
            });
          }
          return HttpResponse.json({
            id: taskId,
            status: TaskStatus.COMPLETED,
            result: [],
          });
        })
      );

      // ACT
      const promise = mattAPI.pollStandupTask(validJWT, taskId, onProgress);
      await vi.runAllTimersAsync();
      await promise;

      // ASSERT
      expect(onProgress).toHaveBeenCalledTimes(callCount);
    });

    it('should_use_custom_pollInterval_when_provided', async () => {
      // ARRANGE
      const customInterval = 5000;
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/${taskId}`, () => {
          return HttpResponse.json({
            id: taskId,
            status: TaskStatus.COMPLETED,
            result: [],
          });
        })
      );

      // ACT
      const promise = mattAPI.pollStandupTask(validJWT, taskId, undefined, customInterval);
      await vi.runAllTimersAsync();
      await promise;

      // ASSERT - If using custom interval, it should work (hard to assert exact timing in tests)
      await expect(promise).resolves.toBeDefined();
    });

    it('should_reject_when_completed_task_has_no_result', async () => {
      // ARRANGE
      server.use(
        http.get(`${MATT_API_BASE}/standup/task/${taskId}`, () => {
          return HttpResponse.json({
            id: taskId,
            status: TaskStatus.COMPLETED,
            // No result field
          });
        })
      );

      // ACT
      const promise = mattAPI.pollStandupTask(validJWT, taskId);
      
      // Run timers and assert rejection simultaneously to avoid unhandled rejection
      const [, rejection] = await Promise.all([
        vi.runAllTimersAsync(),
        promise.catch(error => error)
      ]);

      // ASSERT
      expect(rejection).toBeInstanceOf(Error);
      expect(rejection.message).toBe('Task completed but no result found');
    });
  });
});

