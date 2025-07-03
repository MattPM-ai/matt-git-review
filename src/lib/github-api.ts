import {
  getCachedCommits,
  getCachedIssues,
  getCachedPulls,
  getCachedActivity,
  getCommitsCacheKey,
  getIssuesCacheKey,
  getPullsCacheKey,
  getActivityCacheKey,
  isBrowser,
} from "./cache";

// GitHub API Types
export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: GitHubUser | null;
  html_url: string;
  repository: GitHubRepo;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  html_url: string;
  repository: GitHubRepo;
  pull_request?: unknown;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  html_url: string;
  repository: GitHubRepo;
}

export type ActivityWithType =
  | (GitHubCommit & { type: "commits" })
  | (GitHubIssue & { type: "issues" })
  | (GitHubPullRequest & { type: "pulls" });

export interface CommitAuthor {
  login: string;
  name: string;
  email: string;
  avatar_url?: string;
}

// API Functions
export async function getOrgMembers(
  accessToken: string,
  org: string
): Promise<GitHubUser[]> {
  const response = await fetch(
    `https://api.github.com/orgs/${org}/members?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch organization members");
  }

  return response.json();
}

export async function getOrgRepositories(
  accessToken: string,
  orgName: string
): Promise<GitHubRepo[]> {
  const response = await fetch(
    `https://api.github.com/orgs/${orgName}/repos?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  return response.json();
}

export async function getRepoActivity(
  accessToken: string,
  repo: string,
  type: string,
  author?: string
) {
  if (!isBrowser) {
    return getRepoActivityUncached(accessToken, repo, type, author);
  }

  const orgName = repo.split("/")[0];
  let cacheKey: string;

  switch (type) {
    case "commits":
      cacheKey = getCommitsCacheKey(orgName, repo, author);
      return getCachedCommits(
        cacheKey,
        () =>
          getRepoActivityUncached(accessToken, repo, type, author) as Promise<
            GitHubCommit[]
          >
      );
    case "issues":
      cacheKey = getIssuesCacheKey(orgName, repo, author);
      return getCachedIssues(
        cacheKey,
        () =>
          getRepoActivityUncached(accessToken, repo, type, author) as Promise<
            GitHubIssue[]
          >
      );
    case "pulls":
      cacheKey = getPullsCacheKey(orgName, repo, author);
      return getCachedPulls(
        cacheKey,
        () =>
          getRepoActivityUncached(accessToken, repo, type, author) as Promise<
            GitHubPullRequest[]
          >
      );
    default:
      throw new Error("Invalid activity type");
  }
}

async function getRepoActivityUncached(
  accessToken: string,
  repo: string,
  type: string,
  author?: string
) {
  const baseUrl = `https://api.github.com/repos/${repo}`;
  let url = "";

  switch (type) {
    case "commits":
      url = `${baseUrl}/commits?per_page=50${
        author ? `&author=${author}` : ""
      }`;
      break;
    case "issues":
      url = `${baseUrl}/issues?state=all&per_page=50${
        author ? `&creator=${author}` : ""
      }`;
      break;
    case "pulls":
      url = `${baseUrl}/pulls?state=all&per_page=50${
        author ? `&creator=${author}` : ""
      }`;
      break;
    default:
      throw new Error("Invalid activity type");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.map((item: GitHubCommit | GitHubIssue | GitHubPullRequest) => ({
    ...item,
    repository: {
      name: repo.split("/")[1],
      full_name: repo,
      html_url: `https://github.com/${repo}`,
    },
  }));
}

export async function getAllOrgActivity(
  accessToken: string,
  orgName: string,
  selectedUser?: string
) {
  if (!isBrowser) {
    return getAllOrgActivityUncached(accessToken, orgName, selectedUser);
  }

  const cacheKey = getActivityCacheKey(orgName, selectedUser);
  return getCachedActivity(cacheKey, () =>
    getAllOrgActivityUncached(accessToken, orgName, selectedUser)
  );
}

async function getAllOrgActivityUncached(
  accessToken: string,
  orgName: string,
  selectedUser?: string
) {
  try {
    const repos = await getOrgRepositories(accessToken, orgName);
    const allActivity: {
      commits: GitHubCommit[];
      issues: GitHubIssue[];
      pulls: GitHubPullRequest[];
    } = {
      commits: [],
      issues: [],
      pulls: [],
    };

    // Limit to first 10 repos to avoid API rate limits
    const limitedRepos = repos.slice(0, 10);

    for (const repo of limitedRepos) {
      try {
        const [commits, issues, pulls] = await Promise.all([
          getRepoActivity(accessToken, repo.full_name, "commits", selectedUser),
          getRepoActivity(accessToken, repo.full_name, "issues", selectedUser),
          getRepoActivity(accessToken, repo.full_name, "pulls", selectedUser),
        ]);

        allActivity.commits.push(...commits);
        // Filter out pull requests from issues (GitHub API includes PRs in issues endpoint)
        const realIssues = issues.filter(
          (issue: GitHubIssue) => !issue.pull_request
        );
        allActivity.issues.push(...realIssues);
        allActivity.pulls.push(...pulls);
      } catch (error) {
        console.error(`Error fetching activity for ${repo.full_name}:`, error);
      }
    }

    // Sort by date (most recent first)
    allActivity.commits.sort(
      (a, b) =>
        new Date(b.commit.author.date).getTime() -
        new Date(a.commit.author.date).getTime()
    );
    allActivity.issues.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    allActivity.pulls.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return allActivity;
  } catch (error) {
    console.error("Error fetching organization activity:", error);
    return { commits: [], issues: [], pulls: [] };
  }
}

export async function getRepoCommits(
  accessToken: string,
  repo: GitHubRepo
): Promise<GitHubCommit[]> {
  if (!isBrowser) {
    return getRepoCommitsUncached(accessToken, repo);
  }

  const orgName = repo.full_name.split("/")[0];
  const cacheKey = getCommitsCacheKey(orgName, repo.full_name);
  return getCachedCommits(cacheKey, () =>
    getRepoCommitsUncached(accessToken, repo)
  );
}

async function getRepoCommitsUncached(
  accessToken: string,
  repo: GitHubRepo
): Promise<GitHubCommit[]> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo.full_name}/commits?per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      // 409 typically means empty repository, 404 means not found, etc.
      // These are expected for some repos, so we'll just return empty array silently
      if (response.status !== 409 && response.status !== 404) {
        console.warn(
          `Could not fetch commits for ${repo.full_name}: ${response.status}`
        );
      }
      return [];
    }

    const commits = await response.json();
    return commits.map((commit: any) => ({
      ...commit,
      repository: repo,
    }));
  } catch (error) {
    // Silently handle network errors or other issues
    return [];
  }
}

export async function getAllOrgCommits(
  accessToken: string,
  org: string
): Promise<GitHubCommit[]> {
  if (!isBrowser) {
    return getAllOrgCommitsUncached(accessToken, org);
  }

  const cacheKey = getCommitsCacheKey(org);
  return getCachedCommits(cacheKey, () =>
    getAllOrgCommitsUncached(accessToken, org)
  );
}

async function getAllOrgCommitsUncached(
  accessToken: string,
  org: string
): Promise<GitHubCommit[]> {
  try {
    const reposResponse = await fetch(
      `https://api.github.com/orgs/${org}/repos?per_page=30&sort=pushed`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!reposResponse.ok) {
      console.warn(
        `Could not fetch organization repositories: ${reposResponse.status}`
      );
      return [];
    }

    const repos: GitHubRepo[] = await reposResponse.json();

    const commitPromises = repos.map((repo) =>
      getRepoCommits(accessToken, repo)
    );

    const commitArrays = await Promise.all(commitPromises);
    const allCommits = commitArrays.flat();

    return allCommits.sort((a, b) => {
      return (
        new Date(b.commit.author.date).getTime() -
        new Date(a.commit.author.date).getTime()
      );
    });
  } catch (error) {
    // Silently handle errors and return empty array
    return [];
  }
}

// Utility functions
export function extractCommitDates(commits: GitHubCommit[]): string[] {
  return Array.from(
    new Set(commits.map((commit) => commit.commit.author.date.split("T")[0]))
  );
}

export function groupCommitAuthorsByDate(
  commits: GitHubCommit[]
): Record<string, CommitAuthor[]> {
  const dailyCommitAuthors: Record<string, CommitAuthor[]> = {};

  commits.forEach((commit) => {
    const date = commit.commit.author.date.split("T")[0];
    if (!dailyCommitAuthors[date]) {
      dailyCommitAuthors[date] = [];
    }
    const authorInfo = {
      login: commit.author?.login || commit.commit.author.email.split("@")[0],
      name: commit.commit.author.name,
      email: commit.commit.author.email,
      avatar_url: commit.author?.avatar_url,
    };
    dailyCommitAuthors[date].push(authorInfo);
  });

  return dailyCommitAuthors;
}
