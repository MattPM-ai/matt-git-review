/**
 * GITHUB API CLIENT
 * 
 * Centralized client for GitHub API interactions.
 * Handles user organizations, installations, and repositories.
 * 
 * Features:
 * - Uses GitHub OAuth token for authentication
 * - Request/response logging in development mode
 * - Typed error handling
 */

import { APIError } from './errors';
import type {
  GitHubOrganization,
  GitHubInstallation,
  GitHubRepository,
  GitHubInstallationsResponse,
  GitHubRepositoriesResponse,
} from './types';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * GitHub API Client Class
 * 
 * Singleton client for interacting with GitHub's REST API.
 * All methods require a GitHub OAuth access token.
 */
class GitHubAPIClient {
  private readonly baseUrl = 'https://api.github.com';

  /**
   * Make a request to the GitHub API with logging and error handling
   * 
   * @param endpoint - API endpoint (relative to base URL)
   * @param githubToken - GitHub OAuth access token
   * @param options - Additional fetch options
   * @returns Parsed JSON response
   * @throws {APIError} If the request fails
   */
  private async request<T>(
    endpoint: string,
    githubToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const fullUrl = `${this.baseUrl}${endpoint}`;

    // Log request in development
    if (isDevelopment) {
      console.log(`[GitHub API] ${options.method || 'GET'} ${endpoint}`);
    }

    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      ...options.headers,
    };

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text();
        }

        throw new APIError(
          response.statusText || 'GitHub API request failed',
          response.status,
          endpoint,
          errorBody
        );
      }

      const data = await response.json();

      // Log response in development
      if (isDevelopment) {
        console.log('[GitHub API] Response:', data);
      }

      return data as T;
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof APIError) {
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
  // USER ORGANIZATIONS
  // ==========================================================================

  /**
   * Get all organizations the authenticated user belongs to
   * 
   * @param githubToken - GitHub OAuth access token
   * @returns List of user's organizations
   */
  async getUserOrganizations(
    githubToken: string
  ): Promise<GitHubOrganization[]> {
    return this.request<GitHubOrganization[]>(
      '/user/orgs',
      githubToken
    );
  }

  // ==========================================================================
  // INSTALLATIONS
  // ==========================================================================

  /**
   * Get all GitHub App installations for the authenticated user
   * 
   * @param githubToken - GitHub OAuth access token
   * @returns List of installations
   */
  async getUserInstallations(
    githubToken: string
  ): Promise<GitHubInstallation[]> {
    const data = await this.request<GitHubInstallationsResponse>(
      '/user/installations',
      githubToken
    );
    return data.installations;
  }

  /**
   * Get a specific installation by ID
   * 
   * @param githubToken - GitHub OAuth access token
   * @param installationId - Installation ID
   * @returns Installation details or null if not found
   */
  async getInstallation(
    githubToken: string,
    installationId: string
  ): Promise<GitHubInstallation | null> {
    try {
      const installations = await this.getUserInstallations(githubToken);
      return (
        installations.find(
          (inst) => inst.id === parseInt(installationId)
        ) || null
      );
    } catch (error) {
      if (error instanceof APIError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get repositories accessible by a specific installation
   * 
   * @param githubToken - GitHub OAuth access token
   * @param installationId - Installation ID
   * @returns List of repositories
   */
  async getInstallationRepositories(
    githubToken: string,
    installationId: string
  ): Promise<GitHubRepository[]> {
    const data = await this.request<GitHubRepositoriesResponse>(
      `/user/installations/${installationId}/repositories`,
      githubToken
    );
    return data.repositories || [];
  }

  // ==========================================================================
  // REPOSITORIES
  // ==========================================================================

  /**
   * Get all repositories for the authenticated user
   * 
   * @param githubToken - GitHub OAuth access token
   * @param options - Query options (per_page, page, sort, direction)
   * @returns List of repositories
   */
  async getUserRepositories(
    githubToken: string,
    options: {
      per_page?: number;
      page?: number;
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
    } = {}
  ): Promise<GitHubRepository[]> {
    const queryParams = new URLSearchParams();
    if (options.per_page) queryParams.append('per_page', String(options.per_page));
    if (options.page) queryParams.append('page', String(options.page));
    if (options.sort) queryParams.append('sort', options.sort);
    if (options.direction) queryParams.append('direction', options.direction);

    const endpoint = `/user/repos${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    return this.request<GitHubRepository[]>(endpoint, githubToken);
  }
}

// Export singleton instance
export const githubAPI = new GitHubAPIClient();

