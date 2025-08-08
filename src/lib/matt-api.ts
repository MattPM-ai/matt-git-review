import { authenticatedFetch } from "./fetch-interceptor";

export interface ActivityFilterDto {
  organizationLogin: string;
  dateFrom?: string;
  dateTo?: string;
  activityTypes?: ("commit" | "issue" | "pull")[];
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
  type: "commit";
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
  type: "issue";
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
  type: "pull";
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

export interface StandupRequest {
  organizationLogin: string;
  dateFrom: string;
  dateTo: string;
}

export interface StandupSummary {
  date?: Date;
  summary: string;
  workDone: string[];
  workingOn: string[];
  ongoingIssues: string[];
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
  manHoursRationale: string;
  dailyStandups?: StandupSummary[];
}

export interface StandupResponse {
  username: string;
  name: string;
  avatar_url: string;
  standup: StandupSummary;
}

export enum TaskStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export class NoActivityError extends Error {
  constructor(message: string = "No activity found for this period") {
    super(message);
    this.name = "NoActivityError";
  }
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

class MattAPIClient {
  private getBaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_GIT_API_HOST;
    if (!url) {
      throw new Error(
        "NEXT_PUBLIC_GIT_API_HOST environment variable is not set"
      );
    }
    return url;
  }

  async authenticateUser(accessToken: string): Promise<void> {
    const response = await authenticatedFetch(
      `${this.getBaseUrl()}/users/auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: accessToken }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to authenticate user: ${response.statusText}`);
    }
  }

  async fetchActivities(
    jwtToken: string,
    filter: ActivityFilterDto
  ): Promise<ActivitiesResponseDto> {
    if (!jwtToken) {
      throw new Error("No JWT token provided");
    }

    const response = await authenticatedFetch(
      `${this.getBaseUrl()}/activity/filter`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(filter),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert date strings back to Date objects
    if (data.activities) {
      data.activities = data.activities.map(
        (activity: Record<string, unknown>) => ({
          ...activity,
          created_at: new Date(activity.created_at as string),
          ...(activity.updated_at
            ? { updated_at: new Date(activity.updated_at as string) }
            : {}),
          ...(activity.merged_at
            ? { merged_at: new Date(activity.merged_at as string) }
            : {}),
          ...(activity.closed_at
            ? { closed_at: new Date(activity.closed_at as string) }
            : {}),
        })
      );
    }

    return data;
  }

  async generateStandup(
    jwtToken: string,
    request: StandupRequest
  ): Promise<StandupTaskResponse> {
    if (!jwtToken) {
      throw new Error("No JWT token provided");
    }
    const response = await authenticatedFetch(
      `${this.getBaseUrl()}/standup/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (response.status === 204) {
      // No content - no activity for this period
      throw new NoActivityError();
    }

    if (!response.ok) {
      throw new Error(`Failed to generate standup: ${response.statusText}`);
    }

    return response.json();
  }

  async getStandupTask(jwtToken: string, taskId: string): Promise<StandupTask> {
    if (!jwtToken) {
      throw new Error("No JWT token provided");
    }
    const response = await authenticatedFetch(
      `${this.getBaseUrl()}/standup/task/${taskId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get standup task: ${response.statusText}`);
    }

    return response.json();
  }

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
              reject(new Error("Task completed but no result found"));
            }
          } else if (task.status === TaskStatus.FAILED) {
            reject(
              new Error(task.error_message || "Standup generation failed")
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

export const mattAPI = new MattAPIClient();
