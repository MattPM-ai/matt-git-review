/**
 * MATT API CLIENT
 * 
 * Centralized client for all Matt Backend API interactions.
 * Provides typed methods for organizations, users, activity, standup, email subscriptions, and members.
 * 
 * Features:
 * - Automatic JWT token injection via authenticatedFetch
 * - Request/response logging in development mode
 * - Typed error handling
 * - Response data transformation
 */

import { authenticatedFetch } from '../fetch-interceptor';
import {
  APIError,
  NoActivityError,
  AuthenticationError,
  ConfigurationError,
} from './errors';
import { TaskStatus } from './types';
import type {
  OrgConfig,
  UpdateOrgConfigParams,
  Organization,
  MembersResponse,
  ExternalSubscription,
  UpdateSubscriptionParams,
  InviteAndSendReportParams,
  SendPerformanceEmailParams,
  GenerateTokenResponse,
  ActivityFilterDto,
  ActivitiesResponseDto,
  SimplifiedActivityDto,
  StandupRequest,
  StandupResponse,
  StandupTaskResponse,
  StandupTask,
  AuthenticateUserResponse,
} from './types';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Matt API Client Class
 * 
 * Singleton client for interacting with the Matt Backend API.
 * All methods require a JWT token for authentication.
 */
class MattAPIClient {
  /**
   * Get the base URL for the Matt API
   * @throws {ConfigurationError} If NEXT_PUBLIC_GIT_API_HOST is not configured
   */
  private getBaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_GIT_API_HOST;
    if (!url) {
      throw new ConfigurationError(
        'NEXT_PUBLIC_GIT_API_HOST environment variable is not set'
      );
    }
    return url;
  }

  /**
   * Make a request to the Matt API with logging and error handling
   * 
   * @param endpoint - API endpoint (relative to base URL)
   * @param options - Fetch request options
   * @param jwtToken - JWT token for authentication (optional for some endpoints)
   * @returns Parsed JSON response
   * @throws {APIError} If the request fails
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit,
    jwtToken?: string
  ): Promise<T> {
    const fullUrl = `${this.getBaseUrl()}${endpoint}`;

    // Log request in development
    if (isDevelopment) {
      console.log(`[Matt API] ${options.method || 'GET'} ${endpoint}`);
      if (options.body) {
        console.log('[Matt API] Request Body:', JSON.parse(options.body as string));
      }
    }

    // Add JWT token to headers if provided
    const headers = {
      ...options.headers,
      ...(jwtToken && { Authorization: `Bearer ${jwtToken}` }),
    };

    try {
      const response = await authenticatedFetch(fullUrl, {
        ...options,
        headers,
      });

      // Handle 204 No Content (used for "no activity" responses)
      if (response.status === 204) {
        throw new NoActivityError();
      }

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }

        throw new APIError(
          response.statusText || 'Request failed',
          response.status,
          endpoint,
          errorBody
        );
      }

      const data = await response.json();

      // Log response in development
      if (isDevelopment) {
        console.log('[Matt API] Response:', data);
      }

      return data as T;
    } catch (error) {
      // Re-throw our custom errors
      if (
        error instanceof APIError ||
        error instanceof NoActivityError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      // Wrap unexpected errors
      throw new APIError(
        error instanceof Error ? error.message : 'Unknown error',
        0,
        endpoint
      );
    }
  }

  // ==========================================================================
  // USER AUTHENTICATION
  // ==========================================================================

  /**
   * Authenticate user with GitHub access token
   * Exchanges GitHub OAuth token for Matt JWT token
   * 
   * @param accessToken - GitHub OAuth access token
   * @returns Authentication response with JWT token and user data
   */
  async authenticateUser(accessToken: string): Promise<AuthenticateUserResponse> {
    return this.request<AuthenticateUserResponse>(
      '/users/auth',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ access_token: accessToken }),
      }
    );
  }

  // ==========================================================================
  // ORGANIZATIONS
  // ==========================================================================

  /**
   * Get all organizations for the authenticated user
   * 
   * @param jwtToken - JWT authentication token
   * @returns List of organizations
   */
  async getOrganizations(jwtToken: string): Promise<Organization[]> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<Organization[]>(
      '/organizations',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      jwtToken
    );
  }

  /**
   * Get configuration for a specific organization
   * 
   * @param orgLogin - Organization login/username
   * @param jwtToken - JWT authentication token
   * @returns Organization configuration
   */
  async getOrgConfig(orgLogin: string, jwtToken: string): Promise<OrgConfig> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<OrgConfig>(
      `/organizations/${orgLogin}/config`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      jwtToken
    );
  }

  /**
   * Update configuration for a specific organization
   * 
   * @param orgLogin - Organization login/username
   * @param config - Updated configuration parameters
   * @param jwtToken - JWT authentication token
   * @returns Updated organization configuration
   */
  async updateOrgConfig(
    orgLogin: string,
    config: UpdateOrgConfigParams,
    jwtToken: string
  ): Promise<OrgConfig> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<OrgConfig>(
      `/organizations/${orgLogin}/config`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      },
      jwtToken
    );
  }

  // ==========================================================================
  // MEMBERS
  // ==========================================================================

  /**
   * Get all members of an organization
   * 
   * @param orgLogin - Organization login/username
   * @param jwtToken - JWT authentication token
   * @returns Organization members with subscription data
   */
  async getOrgMembers(
    orgLogin: string,
    jwtToken: string
  ): Promise<MembersResponse> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<MembersResponse>(
      `/organizations/${orgLogin}/members`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      jwtToken
    );
  }

  // ==========================================================================
  // EMAIL SUBSCRIPTIONS
  // ==========================================================================

  /**
   * Get external subscriptions for an organization
   * 
   * @param orgLogin - Organization login/username
   * @param jwtToken - JWT authentication token
   * @returns List of external email subscriptions
   */
  async getExternalSubscriptions(
    orgLogin: string,
    jwtToken: string
  ): Promise<ExternalSubscription[]> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<ExternalSubscription[]>(
      `/email-subscriptions/organization/${orgLogin}?external=true`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      jwtToken
    );
  }

  /**
   * Get a specific email subscription by ID
   * 
   * @param subscriptionId - Subscription ID
   * @param jwtToken - JWT authentication token
   * @returns Email subscription details
   */
  async getSubscription(
    subscriptionId: string,
    jwtToken: string
  ): Promise<ExternalSubscription> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<ExternalSubscription>(
      `/email-subscriptions/${subscriptionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      jwtToken
    );
  }

  /**
   * Update an email subscription's preferences
   * 
   * @param subscriptionId - Subscription ID
   * @param params - Updated subscription parameters
   * @param jwtToken - JWT authentication token
   */
  async updateSubscription(
    subscriptionId: string,
    params: UpdateSubscriptionParams,
    jwtToken: string
  ): Promise<void> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    await this.request<void>(
      `/email-subscriptions/${subscriptionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      },
      jwtToken
    );
  }

  /**
   * Delete an email subscription
   * 
   * @param subscriptionId - Subscription ID
   * @param jwtToken - JWT authentication token
   */
  async deleteSubscription(
    subscriptionId: string,
    jwtToken: string
  ): Promise<void> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    await this.request<void>(
      `/email-subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      jwtToken
    );
  }

  /**
   * Invite a user and send them a performance report
   * Creates a subscription and immediately sends a report email
   * 
   * @param params - Invitation and report parameters
   * @param jwtToken - JWT authentication token (optional)
   */
  async inviteAndSendReport(
    params: InviteAndSendReportParams,
    jwtToken?: string
  ): Promise<void> {
    await this.request<void>(
      '/email-subscriptions/invite-and-send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      },
      jwtToken
    );
  }

  /**
   * Send a performance email without creating a subscription
   * 
   * @param params - Performance email parameters
   * @param jwtToken - JWT authentication token (optional)
   */
  async sendPerformanceEmail(
    params: SendPerformanceEmailParams,
    jwtToken?: string
  ): Promise<void> {
    await this.request<void>(
      '/email-subscriptions/send-performance-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      },
      jwtToken
    );
  }

  /**
   * Generate a JWT token from a subscription ID
   * Used for email link authentication
   * 
   * @param subscriptionId - Subscription ID
   * @returns JWT token for authentication
   */
  async generateSubscriptionToken(
    subscriptionId: string
  ): Promise<GenerateTokenResponse> {
    return this.request<GenerateTokenResponse>(
      `/email-subscriptions/${subscriptionId}/generate-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // ==========================================================================
  // ACTIVITY
  // ==========================================================================

  /**
   * Fetch filtered activity data for an organization
   * 
   * @param jwtToken - JWT authentication token
   * @param filter - Activity filter parameters
   * @returns Filtered activities with user and repository data
   */
  async fetchActivities(
    jwtToken: string,
    filter: ActivityFilterDto
  ): Promise<ActivitiesResponseDto> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    const data = await this.request<ActivitiesResponseDto>(
      '/activity/filter',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter),
      },
      jwtToken
    );

    // Convert date strings back to Date objects
    if (data.activities) {
      data.activities = data.activities.map(
        (activity: SimplifiedActivityDto) => ({
          ...activity,
          created_at: new Date(activity.created_at as unknown as string),
          ...(('updated_at' in activity && activity.updated_at)
            ? { updated_at: new Date(activity.updated_at as unknown as string) }
            : {}),
          ...(('merged_at' in activity && activity.merged_at)
            ? { merged_at: new Date(activity.merged_at as unknown as string) }
            : {}),
          ...(('closed_at' in activity && activity.closed_at)
            ? { closed_at: new Date(activity.closed_at as unknown as string) }
            : {}),
        }) as SimplifiedActivityDto
      );
    }

    return data;
  }

  // ==========================================================================
  // STANDUP
  // ==========================================================================

  /**
   * Generate standup summaries for an organization
   * Returns a task ID for polling the generation status
   * 
   * @param jwtToken - JWT authentication token
   * @param request - Standup generation parameters
   * @returns Task ID for polling
   * @throws {NoActivityError} If there's no activity for the specified period
   */
  async generateStandup(
    jwtToken: string,
    request: StandupRequest
  ): Promise<StandupTaskResponse> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<StandupTaskResponse>(
      '/standup/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      jwtToken
    );
  }

  /**
   * Get the status of a standup generation task
   * 
   * @param jwtToken - JWT authentication token
   * @param taskId - Task ID from generateStandup
   * @returns Task status and result (if completed)
   */
  async getStandupTask(jwtToken: string, taskId: string): Promise<StandupTask> {
    if (!jwtToken) {
      throw new AuthenticationError('JWT token is required');
    }

    return this.request<StandupTask>(
      `/standup/task/${taskId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      jwtToken
    );
  }

  /**
   * Poll a standup task until it completes or fails
   * 
   * @param jwtToken - JWT authentication token
   * @param taskId - Task ID from generateStandup
   * @param onProgress - Callback for progress updates
   * @param pollInterval - Polling interval in milliseconds (default: 2000)
   * @returns Completed standup summaries
   * @throws {APIError} If the task fails
   */
  async pollStandupTask(
    jwtToken: string,
    taskId: string,
    onProgress?: (task: StandupTask) => void,
    pollInterval: number = 2000
  ): Promise<StandupResponse[]> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const task = await this.getStandupTask(jwtToken, taskId);

          if (onProgress) {
            onProgress(task);
          }

          if (task.status === TaskStatus.COMPLETED) {
            if (task.result) {
              resolve(task.result);
            } else {
              reject(new APIError('Task completed but no result found', 0, `/standup/task/${taskId}`));
            }
          } else if (task.status === TaskStatus.FAILED) {
            reject(
              new APIError(
                task.error_message || 'Standup generation failed',
                0,
                `/standup/task/${taskId}`
              )
            );
          } else {
            // Continue polling if status is PENDING or PROCESSING
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

// Export singleton instance
export const mattAPI = new MattAPIClient();

// Re-export TaskStatus enum for convenience
export { TaskStatus } from './types';

