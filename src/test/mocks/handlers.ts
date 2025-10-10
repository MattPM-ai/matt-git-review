/**
 * ============================================================================
 * MSW REQUEST HANDLERS
 * ============================================================================
 * 
 * PURPOSE: Define Mock Service Worker request handlers for API endpoints
 * 
 * This file contains default handlers for:
 * - Matt API endpoints (/users/auth, /users/me, /activity/filter, /standup/*)
 * - GitHub OAuth endpoints
 * - NextAuth session endpoints
 * 
 * Individual tests can override these handlers as needed using server.use()
 * 
 * ============================================================================
 */

import { http, HttpResponse } from 'msw';

const MATT_API_BASE = 'https://api.test.mattpm.ai';

export const handlers = [
  // Matt API: User authentication
  http.post(`${MATT_API_BASE}/users/auth`, () => {
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        login: 'testuser',
        name: 'Test User',
        avatar_url: 'https://avatar.test/user.png',
        html_url: 'https://github.com/testuser',
      },
    });
  }),

  // Matt API: Get current user
  http.get(`${MATT_API_BASE}/users/me`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      id: 'user-123',
      login: 'testuser',
      name: 'Test User',
      avatar_url: 'https://avatar.test/user.png',
      html_url: 'https://github.com/testuser',
    });
  }),

  // Matt API: Activity filter
  http.post(`${MATT_API_BASE}/activity/filter`, () => {
    return HttpResponse.json({
      users: {
        'testuser': {
          id: 123,
          login: 'testuser',
          name: 'Test User',
          avatar_url: 'https://avatar.test/user.png',
          html_url: 'https://github.com/testuser',
        },
      },
      repositories: {
        'org/repo': {
          id: 456,
          name: 'repo',
          full_name: 'org/repo',
          html_url: 'https://github.com/org/repo',
        },
      },
      activities: [
        {
          sha: 'abc123',
          title: 'Test commit',
          user_login: 'testuser',
          html_url: 'https://github.com/org/repo/commit/abc123',
          repository_full_name: 'org/repo',
          created_at: '2025-01-01T12:00:00Z',
          type: 'commit',
        },
      ],
    });
  }),

  // Matt API: Generate standup
  http.post(`${MATT_API_BASE}/standup/generate`, () => {
    return HttpResponse.json({
      taskId: 'task-123',
    });
  }),

  // Matt API: Get standup task
  http.get(`${MATT_API_BASE}/standup/task/:taskId`, ({ params }) => {
    return HttpResponse.json({
      id: params.taskId,
      status: 'completed',
      created_at: '2025-01-01T12:00:00Z',
      completed_at: '2025-01-01T12:00:05Z',
      duration_ms: 5000,
      organization_login: 'test-org',
      request_params: {
        model: 'gpt-4',
        dateTo: '2025-01-01',
        dateFrom: '2025-01-01',
        organizationLogin: 'test-org',
      },
      result: [
        {
          username: 'testuser',
          name: 'Test User',
          avatar_url: 'https://avatar.test/user.png',
          standup: {
            date: '2025-01-01',
            summary: 'Worked on features',
            workDone: ['Implemented feature A'],
            workingOn: ['Planning feature B'],
            totalCommits: 5,
            totalPRs: 2,
            totalIssues: 1,
            totalManHoursMin: 4,
            totalManHoursMax: 6,
            manHoursRationale: 'Based on commit activity',
            concerns: 'None',
          },
        },
      ],
    });
  }),

  // Matt API: Email subscription token generation
  http.post(`${MATT_API_BASE}/email-subscriptions/:subscriptionId/generate-token`, () => {
    return HttpResponse.json({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiZ2l0aHViX29yZyIsInVzZXJuYW1lIjoidGVzdC1vcmciLCJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJUZXN0IFVzZXIiLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJhdmF0YXJfdXJsIjoiaHR0cHM6Ly9hdmF0YXIudGVzdC91c2VyLnBuZyIsImh0bWxfdXJsIjoiaHR0cHM6Ly9naXRodWIuY29tL3Rlc3R1c2VyIn0.mock-signature',
    });
  }),
];

