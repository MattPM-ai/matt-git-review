import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StandupDashboard } from "@/components/standup-dashboard";
import { StandupSidebar } from "@/components/standup-sidebar";
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
    <DashboardLayout
      orgName={orgName}
      title="Standup"
      currentView="standup"
      sidebar={
        <StandupSidebar
          members={members}
          commitDates={commitDates}
          selectedDate={dateFrom}
          orgName={orgName}
          dailyCommitAuthors={dailyCommitAuthors}
        />
      }
    >
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
    </DashboardLayout>
  );
}