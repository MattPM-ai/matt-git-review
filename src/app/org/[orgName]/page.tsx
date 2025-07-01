import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { UserProfile } from "@/components/auth/user-profile";
import { ActivityFilters } from "@/components/activity-filters";

interface OrgActivityPageProps {
  params: {
    orgName: string;
  };
  searchParams: {
    user?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
}

interface GitHubCommit {
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

interface GitHubIssue {
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

interface GitHubPullRequest {
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

type ActivityWithType = 
  | (GitHubCommit & { type: "commits" })
  | (GitHubIssue & { type: "issues" })
  | (GitHubPullRequest & { type: "pulls" })

async function getOrgRepositories(accessToken: string, orgName: string) {
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

async function getOrgMembers(accessToken: string, orgName: string) {
  const response = await fetch(
    `https://api.github.com/orgs/${orgName}/members?per_page=100`,
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

async function getRepoActivity(
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
  return data.map((item: any) => ({
    ...item,
    repository: {
      name: repo.split("/")[1],
      full_name: repo,
      html_url: `https://github.com/${repo}`,
    },
  }));
}

async function getAllOrgActivity(
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
        const realIssues = issues.filter((issue: any) => !issue.pull_request);
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

function ActivityItem({ item, type }: { item: any; type: string }) {
  const getIcon = () => {
    switch (type) {
      case "commits":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "issues":
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "pulls":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  const getDate = () => {
    if (type === "commits") {
      return new Date(item.commit.author.date).toLocaleDateString();
    }
    return new Date(item.created_at).toLocaleDateString();
  };

  const getTitle = () => {
    if (type === "commits") {
      return item.commit.message.split("\n")[0];
    }
    return item.title;
  };

  const getAuthor = () => {
    if (type === "commits") {
      return item.author?.login || item.commit.author.name;
    }
    return item.user.login;
  };

  const getAuthorAvatar = () => {
    if (type === "commits") {
      return item.author?.avatar_url;
    }
    return item.user.avatar_url;
  };

  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-200 hover:bg-gray-50">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getAuthorAvatar() && (
            <img
              src={getAuthorAvatar()}
              alt={getAuthor()}
              className="w-5 h-5 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-900">
            {getAuthor()}
          </span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">{getDate()}</span>
          <span className="text-sm text-gray-500">•</span>
          <a
            href={item.repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            {item.repository.name}
          </a>
        </div>
        <a
          href={item.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-900 hover:text-blue-600 font-medium"
        >
          {getTitle()}
        </a>
        {type !== "commits" && (
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                item.state === "open"
                  ? "bg-green-100 text-green-800"
                  : item.state === "closed"
                  ? "bg-red-100 text-red-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {item.state}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function OrgActivityPage({
  params,
  searchParams,
}: OrgActivityPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { orgName } = params;
  const {
    user: selectedUser,
    type: selectedType,
    dateFrom: selectedDateFrom,
    dateTo: selectedDateTo,
  } = searchParams;

  let members: GitHubUser[] = [];
  let activity: {
    commits: GitHubCommit[];
    issues: GitHubIssue[];
    pulls: GitHubPullRequest[];
  } = {
    commits: [],
    issues: [],
    pulls: [],
  };
  let error = null;

  try {
    const results = await Promise.all([
      getOrgMembers(session.accessToken!, orgName),
      getAllOrgActivity(session.accessToken!, orgName, selectedUser),
    ]);
    members = results[0];
    activity = results[1];
  } catch (e) {
    error = "Failed to fetch organization data";
  }

  // Combine all activities for display
  const allActivities: ActivityWithType[] = [
    ...activity.commits.map((c) => ({ ...c, type: "commits" as const })),
    ...activity.issues.map((i) => ({ ...i, type: "issues" as const })),
    ...activity.pulls.map((p) => ({ ...p, type: "pulls" as const })),
  ].sort((a, b) => {
    const dateA =
      a.type === "commits"
        ? new Date(a.commit.author.date)
        : new Date(a.created_at);
    const dateB =
      b.type === "commits"
        ? new Date(b.commit.author.date)
        : new Date(b.created_at);
    return dateB.getTime() - dateA.getTime();
  });

  // Filter by type and date if selected
  let filteredActivities = selectedType
    ? allActivities.filter((activity) => activity.type === selectedType)
    : allActivities;

  // Apply date filtering
  if (selectedDateFrom || selectedDateTo) {
    filteredActivities = filteredActivities.filter((activity) => {
      const activityDate =
        activity.type === "commits"
          ? new Date((activity as GitHubCommit & { type: "commits" }).commit.author.date)
          : new Date((activity as (GitHubIssue | GitHubPullRequest) & { type: string }).created_at);

      let passesDateFilter = true;

      if (selectedDateFrom) {
        passesDateFilter =
          passesDateFilter && activityDate >= new Date(selectedDateFrom);
      }

      if (selectedDateTo) {
        const toDate = new Date(selectedDateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        passesDateFilter = passesDateFilter && activityDate <= toDate;
      }

      return passesDateFilter;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <h1 className="text-2xl font-semibold text-gray-900">
                {orgName} Activity
              </h1>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <ActivityFilters
          members={members}
          selectedUser={selectedUser}
          selectedType={selectedType}
          selectedDateFrom={selectedDateFrom}
          selectedDateTo={selectedDateTo}
        />

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Activity Feed
              <span className="ml-2 text-sm text-gray-500">
                ({filteredActivities.length} items)
              </span>
            </h3>

            {filteredActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No activity found for the selected filters.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredActivities.slice(0, 100).map((item, index) => (
                  <ActivityItem
                    key={`${item.type}-${(item as any).id || (item as any).sha}-${index}`}
                    item={item}
                    type={item.type}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
