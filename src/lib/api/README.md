# API Client Documentation

This directory contains centralized API clients for all external service interactions in the Matt Git Review frontend application.

## Architecture Overview

The API layer is organized into domain-specific clients that provide typed, consistent interfaces for:
- **Matt Backend API** - Internal application backend
- **GitHub API** - GitHub OAuth and repository management
- **Error Handling** - Typed error classes
- **Type Safety** - Comprehensive TypeScript interfaces

## Directory Structure

```
src/lib/api/
├── matt-api-client.ts      # Matt Backend API client
├── github-api-client.ts    # GitHub API client
├── errors.ts               # Typed error classes
├── types.ts                # Shared TypeScript interfaces
├── index.ts                # Barrel export
├── __tests__/              # Test suites
│   ├── matt-api-client.test.ts
│   └── github-api-client.test.ts
└── README.md               # This file
```

## Usage Guide

### Basic Import

```typescript
import { mattAPI, githubAPI, APIError, NoActivityError } from '@/lib/api';
import type { OrgConfig, GitHubOrganization } from '@/lib/api';
```

### Matt Backend API Client

The `mattAPI` client handles all interactions with the Matt Backend API.

#### Authentication

```typescript
// Exchange GitHub token for Matt JWT
const authResponse = await mattAPI.authenticateUser(githubAccessToken);
console.log(authResponse.access_token); // Matt JWT token
```

#### Organizations

```typescript
// Get all user's organizations
const orgs = await mattAPI.getOrganizations(jwtToken);

// Get organization configuration
const config = await mattAPI.getOrgConfig('my-org', jwtToken);

// Update organization configuration
const updatedConfig = await mattAPI.updateOrgConfig(
  'my-org',
  {
    country: 'US',
    timezone: 'America/New_York',
    preferredEmailTime: '09:00',
    dailyReport: true,
    weeklyReport: true,
    monthlyReport: false,
    sendEmptyWeekdayReports: false,
  },
  jwtToken
);
```

#### Members

```typescript
// Get organization members
const membersResponse = await mattAPI.getOrgMembers('my-org', jwtToken);
console.log(membersResponse.organization);
console.log(membersResponse.members);
```

#### Email Subscriptions

```typescript
// Get external subscriptions for an organization
const subscriptions = await mattAPI.getExternalSubscriptions('my-org', jwtToken);

// Get a specific subscription
const subscription = await mattAPI.getSubscription(subscriptionId, jwtToken);

// Update subscription preferences
await mattAPI.updateSubscription(
  subscriptionId,
  {
    dailyReport: true,
    weeklyReport: true,
    monthlyReport: false,
  },
  jwtToken
);

// Delete a subscription
await mattAPI.deleteSubscription(subscriptionId, jwtToken);

// Invite user and send performance report
await mattAPI.inviteAndSendReport(
  {
    email: 'user@example.com',
    organizationLogin: 'my-org',
    subscribe: true,
    dateFrom: '2025-01-01',
    dateTo: '2025-01-31',
    timeframe: 'monthly',
  },
  jwtToken
);

// Generate JWT from subscription ID (for email link auth)
const tokenResponse = await mattAPI.generateSubscriptionToken(subscriptionId);
```

#### Activity Tracking

```typescript
// Fetch filtered activities
const activities = await mattAPI.fetchActivities(jwtToken, {
  organizationLogin: 'my-org',
  dateFrom: '2025-01-01',
  dateTo: '2025-01-31',
  activityTypes: ['commit', 'pull', 'issue'],
  usernames: ['user1', 'user2'],
  limit: 100,
  offset: 0,
});

console.log(activities.users);        // User data keyed by username
console.log(activities.repositories); // Repository data keyed by full_name
console.log(activities.activities);   // Array of activities with Date objects
```

#### Standup Generation

```typescript
// Generate standup summaries (async task)
const taskResponse = await mattAPI.generateStandup(jwtToken, {
  organizationLogin: 'my-org',
  dateFrom: '2025-01-20',
  dateTo: '2025-01-20',
});

// Poll for task completion
const standupSummaries = await mattAPI.pollStandupTask(
  jwtToken,
  taskResponse.taskId,
  (task) => {
    console.log(`Status: ${task.status}`);
    // Progress callback
  },
  2000 // Poll interval in ms
);

// Or manually check task status
const task = await mattAPI.getStandupTask(jwtToken, taskResponse.taskId);
if (task.status === TaskStatus.COMPLETED) {
  console.log(task.result);
}
```

### GitHub API Client

The `githubAPI` client handles interactions with GitHub's REST API using GitHub OAuth tokens.

#### User Organizations

```typescript
// Get all user's GitHub organizations
const githubOrgs = await githubAPI.getUserOrganizations(githubAccessToken);

githubOrgs.forEach(org => {
  console.log(`${org.login}: ${org.description}`);
});
```

#### GitHub App Installations

```typescript
// Get all installations
const installations = await githubAPI.getUserInstallations(githubAccessToken);

// Get specific installation
const installation = await githubAPI.getInstallation(
  githubAccessToken,
  installationId
);

// Get repositories for an installation
const repos = await githubAPI.getInstallationRepositories(
  githubAccessToken,
  installationId
);
```

#### User Repositories

```typescript
// Get user's repositories with options
const repos = await githubAPI.getUserRepositories(githubAccessToken, {
  per_page: 50,
  page: 1,
  sort: 'updated',
  direction: 'desc',
});
```

## Error Handling

All API clients throw typed errors that you can catch and handle appropriately.

### Error Types

```typescript
import { APIError, NoActivityError, AuthenticationError, ConfigurationError } from '@/lib/api';

try {
  const data = await mattAPI.getOrgConfig('my-org', jwtToken);
} catch (error) {
  if (error instanceof NoActivityError) {
    // Handle no activity scenario
    console.log('No activity found for this period');
  } else if (error instanceof AuthenticationError) {
    // Handle authentication failure
    console.error('Authentication required');
  } else if (error instanceof APIError) {
    // Handle general API errors
    console.error(`API Error: ${error.message} (${error.statusCode})`);
    console.error(`Endpoint: ${error.endpoint}`);
    console.error('Response:', error.responseBody);
  } else if (error instanceof ConfigurationError) {
    // Handle configuration errors (missing env vars, etc.)
    console.error('Configuration error:', error.message);
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

### Common Error Scenarios

**401 Unauthorized:**
```typescript
// APIError with statusCode: 401
// Automatically triggers sign-out via authenticatedFetch interceptor
```

**404 Not Found:**
```typescript
// APIError with statusCode: 404
if (error instanceof APIError && error.statusCode === 404) {
  console.log('Resource not found');
}
```

**204 No Content (No Activity):**
```typescript
// Throws NoActivityError
if (error instanceof NoActivityError) {
  console.log('No activity for this period');
}
```

## Development Features

### Request Logging

In development mode (`NODE_ENV === 'development'`), all API requests and responses are automatically logged to the console:

```
[Matt API] GET /organizations/my-org/config
[Matt API] Response: { id: '123', login: 'my-org', ... }
```

```
[GitHub API] GET /user/orgs
[GitHub API] Response: [{ id: 123, login: 'my-org', ... }]
```

### Token Management

- **Matt API**: Uses JWT tokens via `Authorization: Bearer <token>` header
- **GitHub API**: Uses GitHub OAuth tokens via `Authorization: Bearer <token>` header
- All authenticated requests go through the `authenticatedFetch` interceptor which:
  - Validates token existence and expiration
  - Handles 401 errors with automatic sign-out
  - Differentiates between OAuth and direct JWT auth flows

## Type Safety

All API methods are fully typed with TypeScript interfaces:

```typescript
// Request types
interface UpdateOrgConfigParams {
  country: string;
  timezone: string;
  preferredEmailTime: string;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  sendEmptyWeekdayReports: boolean;
}

// Response types
interface OrgConfig {
  id: string;
  login: string;
  name: string;
  initialSetupAt: string | null;
  country: string | null;
  timezone: string | null;
  preferredEmailTime: string | null;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  sendEmptyWeekdayReports: boolean;
}

// Usage with full type inference
const config: OrgConfig = await mattAPI.getOrgConfig('my-org', jwtToken);
```

## Testing

### Mocking API Clients

Use MSW (Mock Service Worker) to mock API responses in tests:

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

// Mock Matt API endpoint
server.use(
  http.get('https://api.mattpm.ai/organizations/:orgLogin/config', () => {
    return HttpResponse.json({
      id: 'test-org-id',
      login: 'test-org',
      name: 'Test Organization',
      // ... other fields
    });
  })
);

// Mock GitHub API endpoint
server.use(
  http.get('https://api.github.com/user/orgs', () => {
    return HttpResponse.json([
      { id: 123, login: 'test-org', avatar_url: 'https://...' },
    ]);
  })
);
```

### Test Examples

See `__tests__/` directory for comprehensive test suites:
- `matt-api-client.test.ts` - Full coverage of Matt API client
- `github-api-client.test.ts` - Full coverage of GitHub API client

## Migration from Legacy Code

If you're updating code that used the old API patterns:

### Before (Legacy)
```typescript
import { getOrgConfig, updateOrgConfig } from '@/lib/org-config';
import { getOrgMembers } from '@/lib/members-api';

const config = await getOrgConfig(orgLogin, jwtToken);
const members = await getOrgMembers(orgLogin, jwtToken);
```

### After (New API)
```typescript
import { mattAPI } from '@/lib/api';

const config = await mattAPI.getOrgConfig(orgLogin, jwtToken);
const members = await mattAPI.getOrgMembers(orgLogin, jwtToken);
```

## Best Practices

1. **Always use the centralized clients** - Don't create ad-hoc fetch calls
2. **Handle errors appropriately** - Use typed error classes for specific error scenarios
3. **Pass JWT tokens explicitly** - Don't store tokens in client state
4. **Use TypeScript types** - Import and use the provided interfaces
5. **Check development logs** - Monitor console logs during development
6. **Test with MSW** - Use Mock Service Worker for consistent test mocks

## Environment Configuration

Required environment variables:

```bash
# Matt Backend API
NEXT_PUBLIC_GIT_API_HOST=https://api.mattpm.ai

# GitHub OAuth (for GitHub API)
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
```

## Support

For issues or questions about the API clients:
1. Check this documentation
2. Review the comprehensive test suites in `__tests__/`
3. Examine the implementation in `matt-api-client.ts` and `github-api-client.ts`
4. Check existing usage examples in components and hooks

