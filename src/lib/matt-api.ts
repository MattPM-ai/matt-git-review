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
    const response = await fetch(`${this.getBaseUrl()}/users/auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
      throw new Error(`Failed to authenticate user: ${response.statusText}`);
    }
  }

  async fetchActivities(
    accessToken: string,
    filter: ActivityFilterDto
  ): Promise<ActivitiesResponseDto> {
    const response = await fetch(`${this.getBaseUrl()}/activity/filter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(filter),
    });

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
    accessToken: string,
    request: StandupRequest
  ): Promise<StandupResponse[]> {
    const response = await fetch(`${this.getBaseUrl()}/standup/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate standup: ${response.statusText}`);
    }

    return response.json();
  }
}

export const mattAPI = new MattAPIClient();
