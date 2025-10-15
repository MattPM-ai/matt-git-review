/**
 * ============================================================================
 * TEST SUITE: Standup API Route
 * ============================================================================
 * 
 * MODULE UNDER TEST: /api/standup route handler
 * TEST TYPE: Integration
 * FRAMEWORK: Vitest
 * 
 * AUTHOR: Test Suite Generator
 * CREATED: 2025-10-10
 * LAST MODIFIED: 2025-10-10
 * VERSION: 1.0.0
 * 
 * DESCRIPTION:
 * Comprehensive test suite for the standup API route POST handler which
 * generates standup reports by calling the Matt API.
 * 
 * DEPENDENCIES:
 * - vitest: ^3.2.4 - Test framework
 * - next: API route testing
 * - msw: ^2.11.5 - API mocking
 * 
 * COVERAGE SCOPE:
 * ✓ Authentication validation
 * ✓ Request validation
 * ✓ Successful standup generation
 * ✓ Error handling
 * 
 * EXECUTION REQUIREMENTS:
 * - Environment: Node.js
 * - Prerequisites: MSW server, auth mocking
 * - Runtime: <300ms
 * 
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';
import { createMockJWT } from '@/test/utils/test-utils';
import type { Session } from 'next-auth';

const MATT_API_BASE = 'https://api.test.mattpm.ai';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Import the mocked auth after setting up the mock
import { auth } from '@/lib/auth';

// Helper to create valid JWT
function createValidJWT(): string {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  return createMockJWT({
    sub: 'user-123',
    exp: futureExp,
    iat: Math.floor(Date.now() / 1000),
  });
}

describe('POST /api/standup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // TEST: Authentication
  // ========================================================================

  it('should_return_401_when_session_has_no_mattJwtToken', async () => {
    // ARRANGE
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123', name: 'Test User' },
      // No mattJwtToken
    } as Partial<Session>);

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should_return_401_when_no_session_exists', async () => {
    // ARRANGE
    vi.mocked(auth).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  // ========================================================================
  // TEST: Request Validation
  // ========================================================================

  it('should_return_400_when_orgName_is_missing', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        // Missing orgName
        date: '2025-01-01',
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should_return_400_when_date_is_missing', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        // Missing date
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  // ========================================================================
  // TEST: Successful Request
  // ========================================================================

  it('should_successfully_generate_standup_with_orgName_and_date', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(200);
    expect(data.taskId).toBeDefined();
    expect(data.taskId).toBe('task-123');
  });

  it('should_use_date_for_both_dateFrom_and_dateTo_when_no_dateRange', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    let requestBody: unknown = null;
    server.use(
      http.post(`${MATT_API_BASE}/standup/generate`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ taskId: 'task-456' });
      })
    );

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-15',
      }),
    });

    // ACT
    await POST(request);

    // ASSERT
    const body = requestBody as Record<string, unknown>;
    expect(body.organizationLogin).toBe('test-org');
    expect(body.dateFrom).toBe('2025-01-15');
    expect(body.dateTo).toBe('2025-01-15');
  });

  it('should_use_dateRange_when_provided', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    let requestBody: unknown = null;
    server.use(
      http.post(`${MATT_API_BASE}/standup/generate`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ taskId: 'task-789' });
      })
    );

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
        dateRange: {
          dateFrom: '2025-01-01',
          dateTo: '2025-01-31',
        },
      }),
    });

    // ACT
    await POST(request);

    // ASSERT
    const body = requestBody as Record<string, unknown>;
    expect(body.organizationLogin).toBe('test-org');
    expect(body.dateFrom).toBe('2025-01-01');
    expect(body.dateTo).toBe('2025-01-31');
  });

  it('should_call_mattAPI_generateStandup_with_correct_parameters', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    let capturedAuthHeader: string | null = null;
    server.use(
      http.post(`${MATT_API_BASE}/standup/generate`, ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ taskId: 'task-999' });
      })
    );

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'my-org',
        date: '2025-02-01',
      }),
    });

    // ACT
    await POST(request);

    // ASSERT
    expect(capturedAuthHeader).toBe(`Bearer ${validJWT}`);
  });

  it('should_return_task_response_from_mattAPI', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    const mockTaskId = 'custom-task-id-123';
    server.use(
      http.post(`${MATT_API_BASE}/standup/generate`, () => {
        return HttpResponse.json({ taskId: mockTaskId });
      })
    );

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(data.taskId).toBe(mockTaskId);
  });

  // ========================================================================
  // TEST: Error Handling
  // ========================================================================

  it('should_return_500_when_mattAPI_throws_error', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    server.use(
      http.post(`${MATT_API_BASE}/standup/generate`, () => {
        return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
      })
    );

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    // When authenticatedFetch throws on 401, route catches and returns 500
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate standup summaries');
  });

  it('should_return_500_for_other_errors', async () => {
    // ARRANGE
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    server.use(
      http.post(`${MATT_API_BASE}/standup/generate`, () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
      }),
    });

    // ACT
    const response = await POST(request);
    const data = await response.json();

    // ASSERT
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate standup summaries');
  });

  it('should_log_errors_to_console', async () => {
    // ARRANGE
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const validJWT = createValidJWT();
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-123' },
      mattJwtToken: validJWT,
    } as Partial<Session>);

    server.use(
      http.post(`${MATT_API_BASE}/standup/generate`, () => {
        throw new Error('Test error');
      })
    );

    const request = new NextRequest('http://localhost:3000/api/standup', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'test-org',
        date: '2025-01-01',
      }),
    });

    // ACT
    await POST(request);

    // ASSERT
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error generating standup summaries:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

