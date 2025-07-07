import { GitHubCommit, GitHubIssue, GitHubPullRequest } from "./github-api";

/**
 * Deduplicate commits by SHA
 */
export function deduplicateCommits(commits: GitHubCommit[]): GitHubCommit[] {
  const seen = new Set<string>();
  return commits.filter(commit => {
    if (seen.has(commit.sha)) {
      return false;
    }
    seen.add(commit.sha);
    return true;
  });
}

/**
 * Deduplicate issues by ID
 */
export function deduplicateIssues(issues: GitHubIssue[]): GitHubIssue[] {
  const seen = new Set<number>();
  return issues.filter(issue => {
    if (seen.has(issue.id)) {
      return false;
    }
    seen.add(issue.id);
    return true;
  });
}

/**
 * Deduplicate pull requests by ID
 */
export function deduplicatePulls(pulls: GitHubPullRequest[]): GitHubPullRequest[] {
  const seen = new Set<number>();
  return pulls.filter(pull => {
    if (seen.has(pull.id)) {
      return false;
    }
    seen.add(pull.id);
    return true;
  });
}

/**
 * Merge two arrays of items while avoiding duplicates
 */
export function mergeWithoutDuplicates<T>(
  existing: T[],
  newItems: T[],
  getKey: (item: T) => string | number
): T[] {
  const existingKeys = new Set(existing.map(getKey));
  const uniqueNewItems = newItems.filter(item => !existingKeys.has(getKey(item)));
  return [...existing, ...uniqueNewItems];
}

/**
 * Merge commits without duplicates
 */
export function mergeCommits(existing: GitHubCommit[], newCommits: GitHubCommit[]): GitHubCommit[] {
  return mergeWithoutDuplicates(existing, newCommits, c => c.sha);
}

/**
 * Merge issues without duplicates
 */
export function mergeIssues(existing: GitHubIssue[], newIssues: GitHubIssue[]): GitHubIssue[] {
  return mergeWithoutDuplicates(existing, newIssues, i => i.id);
}

/**
 * Merge pull requests without duplicates
 */
export function mergePulls(existing: GitHubPullRequest[], newPulls: GitHubPullRequest[]): GitHubPullRequest[] {
  return mergeWithoutDuplicates(existing, newPulls, p => p.id);
}

/**
 * Get the most recent date from a list of commits
 */
export function getLatestCommitDate(commits: GitHubCommit[]): Date | null {
  if (commits.length === 0) return null;
  
  const latestCommit = commits.reduce((latest, commit) => {
    const commitDate = new Date(commit.commit.author.date);
    const latestDate = new Date(latest.commit.author.date);
    return commitDate > latestDate ? commit : latest;
  });
  
  return new Date(latestCommit.commit.author.date);
}

/**
 * Get the most recent date from a list of issues
 */
export function getLatestIssueDate(issues: GitHubIssue[]): Date | null {
  if (issues.length === 0) return null;
  
  const latestIssue = issues.reduce((latest, issue) => {
    const issueDate = new Date(issue.created_at);
    const latestDate = new Date(latest.created_at);
    return issueDate > latestDate ? issue : latest;
  });
  
  return new Date(latestIssue.created_at);
}

/**
 * Get the most recent date from a list of pull requests
 */
export function getLatestPullDate(pulls: GitHubPullRequest[]): Date | null {
  if (pulls.length === 0) return null;
  
  const latestPull = pulls.reduce((latest, pull) => {
    const pullDate = new Date(pull.created_at);
    const latestDate = new Date(latest.created_at);
    return pullDate > latestDate ? pull : latest;
  });
  
  return new Date(latestPull.created_at);
}