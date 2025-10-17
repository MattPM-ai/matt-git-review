/**
 * API CLIENT EXPORTS
 * 
 * Centralized barrel export for all API clients, types, and errors.
 * Provides a clean import interface for the rest of the application.
 * 
 * Usage:
 * ```typescript
 * import { mattAPI, githubAPI, APIError } from '@/lib/api';
 * ```
 */

// ============================================================================
// API CLIENTS
// ============================================================================

export { mattAPI } from './matt-api-client';
export { githubAPI } from './github-api-client';

// ============================================================================
// ERROR CLASSES
// ============================================================================

export {
  APIError,
  NoActivityError,
  AuthenticationError,
  ConfigurationError,
} from './errors';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Organization types
export type {
  OrgConfig,
  UpdateOrgConfigParams,
  Organization,
} from './types';

// Member types
export type {
  Member,
  MembersResponse,
} from './types';

// Email subscription types
export type {
  EmailSubscription,
  ExternalSubscription,
  UpdateSubscriptionParams,
  InviteAndSendReportParams,
  SendPerformanceEmailParams,
  GenerateTokenResponse,
} from './types';

// Activity types
export type {
  ActivityFilterDto,
  SimplifiedCommitDto,
  SimplifiedIssueDto,
  SimplifiedPullRequestDto,
  SimplifiedActivityDto,
  ActivitiesResponseDto,
} from './types';

// Standup types
export type {
  StandupRequest,
  StandupSummary,
  StandupResponse,
  StandupTaskResponse,
  StandupTask,
} from './types';

// Standup enums
export { TaskStatus } from './types';

// GitHub API types
export type {
  GitHubOrganization,
  GitHubInstallation,
  GitHubRepository,
  GitHubInstallationsResponse,
  GitHubRepositoriesResponse,
} from './types';

// User authentication types
export type {
  AuthenticateUserResponse,
} from './types';

