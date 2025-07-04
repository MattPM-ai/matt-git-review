import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ActivityFilters } from "@/components/activity-filters";
import { ActivityContent } from "@/components/activity-content";
import {
  getOrgMembers,
  getAllOrgActivity,
  extractCommitDates,
  type GitHubUser,
  type GitHubCommit,
  type GitHubIssue,
  type GitHubPullRequest,
  type ActivityWithType,
} from "@/lib/github-api";

interface OrgActivityPageProps {
  params: Promise<{
    orgName: string;
  }>;
  searchParams: Promise<{
    user?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}


export default async function OrgActivityPage({
  params,
  searchParams,
}: OrgActivityPageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const paramsData = await params;
  const searchParamsData = await searchParams;
  const { orgName } = paramsData;
  const {
    user: selectedUser,
    type: selectedType,
    dateFrom: selectedDateFrom,
    dateTo: selectedDateTo,
  } = searchParamsData;

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

    console.log("activity", activity);
  } catch {
    error = "Failed to fetch organization data";
  }

  // Extract unique commit dates
  const commitDates = extractCommitDates(activity.commits);

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



  return (
    <DashboardLayout
      orgName={orgName}
      title="Activity"
      currentView="activity"
      sidebar={
        <ActivityFilters
          members={members}
          selectedUser={selectedUser}
          selectedType={selectedType}
          selectedDateFrom={selectedDateFrom}
          selectedDateTo={selectedDateTo}
          commitDates={commitDates}
          allActivities={allActivities}
        />
      }
    >
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <ActivityContent
        allActivities={allActivities}
        selectedUser={selectedUser}
        selectedType={selectedType}
        selectedDateFrom={selectedDateFrom}
      />
    </DashboardLayout>
  );
}
