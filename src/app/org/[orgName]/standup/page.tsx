import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserProfile } from "@/components/auth/user-profile";
import { StandupDashboard } from "@/components/standup-dashboard";
import Link from "next/link";

interface StandupPageProps {
  params: Promise<{
    orgName: string;
  }>;
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
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

async function getOrgMembers(
  accessToken: string,
  org: string
): Promise<GitHubUser[]> {
  const response = await fetch(
    `https://api.github.com/orgs/${org}/members`,
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

async function getRepoCommits(
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
      console.error(`Failed to fetch commits for ${repo.full_name}: ${response.status}`);
      return [];
    }

    const commits = await response.json();
    return commits.map((commit: any) => ({
      ...commit,
      repository: repo,
    }));
  } catch (error) {
    console.error(`Error fetching commits for ${repo.full_name}:`, error);
    return [];
  }
}

async function getAllOrgCommits(
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
      console.error(`Failed to fetch organization repositories: ${reposResponse.status}`);
      return [];
    }

    const repos: GitHubRepo[] = await reposResponse.json();
    
    const commitPromises = repos.map((repo) =>
      getRepoCommits(accessToken, repo)
    );

    const commitArrays = await Promise.all(commitPromises);
    const allCommits = commitArrays.flat();

    return allCommits.sort((a, b) => {
      return new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime();
    });
  } catch (error) {
    console.error("Error fetching organization commits:", error);
    return [];
  }
}

export default async function StandupPage({
  params,
  searchParams,
}: StandupPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { orgName } = await params;
  const { dateFrom } = await searchParams;

  let members: GitHubUser[] = [];
  let commits: GitHubCommit[] = [];
  let error = null;

  try {
    const [membersData, commitsData] = await Promise.all([
      getOrgMembers(session.accessToken!, orgName),
      getAllOrgCommits(session.accessToken!, orgName),
    ]);
    members = membersData;
    commits = commitsData;
  } catch {
    error = "Failed to fetch organization data";
  }

  // Extract unique commit dates and daily authors
  const commitDates = Array.from(
    new Set(
      commits.map((commit) => 
        commit.commit.author.date.split('T')[0]
      )
    )
  );

  // Group commit authors by date
  const dailyCommitAuthors: Record<string, Array<{login: string, name: string, email: string, avatar_url?: string}>> = {};
  commits.forEach(commit => {
    const date = commit.commit.author.date.split('T')[0];
    if (!dailyCommitAuthors[date]) {
      dailyCommitAuthors[date] = [];
    }
    const authorInfo = {
      login: commit.author?.login || commit.commit.author.email.split('@')[0],
      name: commit.commit.author.name,
      email: commit.commit.author.email,
      avatar_url: commit.author?.avatar_url
    };
    dailyCommitAuthors[date].push(authorInfo);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/org/${orgName}`}
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
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">
                {orgName} Standup
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/org/${orgName}/activity`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Switch to Activity View →
              </Link>
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <StandupDashboard
          members={members}
          commitDates={commitDates}
          selectedDate={dateFrom}
          orgName={orgName}
          dailyCommitAuthors={dailyCommitAuthors}
        />
      </main>
    </div>
  );
}