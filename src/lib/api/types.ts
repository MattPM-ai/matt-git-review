/**
 * SHARED API TYPES
 * 
 * TypeScript interfaces and types used across multiple API clients.
 * Organized by domain for easy maintenance and discovery.
 */

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export interface OrgConfig {
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

export interface UpdateOrgConfigParams {
  country: string;
  timezone: string;
  preferredEmailTime: string;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  sendEmptyWeekdayReports: boolean;
}

export interface Organization {
  id: string;
  login: string;
  name: string;
}

// ============================================================================
// MEMBER TYPES
// ============================================================================

export interface Member {
  id: string;
  userId: string;
  username: string;
  name: string;
  email: string | null;
  avatarUrl: string;
  role: string;
  joinedAt: string;
  subscription: EmailSubscription | null;
}

export interface MembersResponse {
  organization: {
    id: string;
    login: string;
    name: string;
    initialSetupAt: string;
  };
  members: Member[];
}

// ============================================================================
// EMAIL SUBSCRIPTION TYPES
// ============================================================================

export interface EmailSubscription {
  id: string;
  email: string;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
  isAutoCreated: boolean;
  externallyManaged: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalSubscription {
  id: string;
  email: string;
  github_org_id: string;
  inviter_github_user_id: string;
  daily_report: boolean;
  weekly_report: boolean;
  monthly_report: boolean;
  is_auto_created: boolean;
  externally_managed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UpdateSubscriptionParams {
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface InviteAndSendReportParams {
  email: string;
  organizationLogin: string;
  subscribe: boolean;
  dateFrom: string;
  dateTo: string;
  timeframe: string;
}

export interface SendPerformanceEmailParams {
  email: string;
  organizationLogin: string;
  dateFrom: string;
  dateTo: string;
  timeframe: string;
}

export interface GenerateTokenResponse {
  token: string;
}

// ============================================================================
// ACTIVITY TYPES
// ============================================================================

export interface ActivityFilterDto {
  organizationLogin: string;
  dateFrom?: string;
  dateTo?: string;
  activityTypes?: ('commit' | 'issue' | 'pull')[];
  usernames?: string[];
  repositoryNames?: string[];
  limit?: number;
  offset?: number;
}

export interface SimplifiedCommitDto {
  sha: string;
  title: string;
  user_login: string | null;
  html_url: string;
  repository_full_name: string;
  created_at: Date;
  type: 'commit';
}

export interface SimplifiedIssueDto {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  user_login: string | null;
  created_at: Date;
  updated_at: Date;
  closed_at: Date | null;
  html_url: string;
  repository_full_name: string;
  type: 'issue';
}

export interface SimplifiedPullRequestDto {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  user_login: string | null;
  created_at: Date;
  updated_at: Date;
  merged_at: Date | null;
  closed_at: Date | null;
  html_url: string;
  repository_full_name: string;
  type: 'pull';
}

export type SimplifiedActivityDto =
  | SimplifiedCommitDto
  | SimplifiedIssueDto
  | SimplifiedPullRequestDto;

export interface ActivitiesResponseDto {
  users: Record<
    string,
    {
      id: number;
      login: string;
      name: string;
      avatar_url: string;
      html_url: string;
    }
  >;
  repositories: Record<
    string,
    {
      id: number;
      name: string;
      full_name: string;
      html_url: string;
    }
  >;
  activities: SimplifiedActivityDto[];
}

// ============================================================================
// STANDUP TYPES
// ============================================================================

export interface StandupRequest {
  organizationLogin: string;
  dateFrom: string;
  dateTo: string;
}

export interface StandupSummary {
  date: string;
  summary: string;
  workDone: string[];
  workingOn: string[];
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
  manHoursRationale: string;
  concerns: string;
  dailyStandups?: StandupSummary[];
}

export interface StandupResponse {
  username: string;
  name: string;
  avatar_url: string;
  standup: StandupSummary;
}

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface StandupTaskResponse {
  taskId: string;
}

export interface StandupTask {
  id: string;
  status: TaskStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  organization_login: string;
  request_params: {
    model: string;
    dateTo: string;
    dateFrom: string;
    organizationLogin: string;
  };
  result?: StandupResponse[];
  error_message?: string;
}

// ============================================================================
// GITHUB API TYPES
// ============================================================================

export interface GitHubOrganization {
  id: number;
  login: string;
  description?: string;
  avatar_url: string;
}

export interface GitHubInstallation {
  id: number;
  account: {
    login: string;
    avatar_url: string;
    type: string;
  };
  repository_selection: 'all' | 'selected';
  created_at: string;
  repositories?: GitHubRepository[];
}

export interface GitHubRepository {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  visibility: string;
  updated_at: string;
  full_name: string;
  html_url: string;
}

export interface GitHubInstallationsResponse {
  installations: GitHubInstallation[];
}

export interface GitHubRepositoriesResponse {
  repositories: GitHubRepository[];
}

// ============================================================================
// USER AUTHENTICATION TYPES
// ============================================================================

export interface AuthenticateUserResponse {
  access_token: string;
  user: {
    id: string;
    login: string;
    name: string;
    avatar_url: string;
    html_url: string;
  };
}

