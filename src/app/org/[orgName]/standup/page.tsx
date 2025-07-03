import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserProfile } from "@/components/auth/user-profile";
import { StandupDashboard } from "@/components/standup-dashboard";
import Link from "next/link";
import { 
  getOrgMembers, 
  getAllOrgCommits, 
  extractCommitDates, 
  groupCommitAuthorsByDate,
  type GitHubUser,
  type GitHubCommit 
} from "@/lib/github-api";

interface StandupPageProps {
  params: Promise<{
    orgName: string;
  }>;
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
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
  const commitDates = extractCommitDates(commits);
  const dailyCommitAuthors = groupCommitAuthorsByDate(commits);

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