import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StandupDashboard } from "@/components/standup-dashboard";
import { StandupSidebar } from "@/components/standup-sidebar";
import { mattAPI, type ActivityFilterDto, type ActivitiesResponseDto } from "@/lib/matt-api";

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

  let activityData: ActivitiesResponseDto | null = null;
  let error = null;

  try {
    // Build filter to fetch only commits for calendar/sidebar data
    const filter: ActivityFilterDto = {
      organizationLogin: orgName,
      activityTypes: ["commit"],
      limit: 1000, // Get a reasonable amount of commits
    };

    // Add date filter if provided
    if (dateFrom) {
      filter.dateFrom = dateFrom;
    }

    // Fetch activities from Matt API for sidebar data
    activityData = await mattAPI.fetchActivities(session.mattJwtToken!, filter);
  } catch (err) {
    console.error("Failed to fetch activities:", err);
    error = "Failed to fetch organization data";
  }

  const members = activityData ? Object.values(activityData.users) : [];
  const commits = activityData
    ? activityData.activities.filter((a) => a.type === "commit")
    : [];

  // Extract unique commit dates
  const commitDates = activityData
    ? Array.from(
        new Set(
          activityData.activities
            .filter((a) => a.type === "commit")
            .map((a) => a.created_at.toISOString().split("T")[0])
        )
      )
        .sort()
        .reverse()
    : [];

  // Group commit authors by date
  const dailyCommitAuthors = activityData
    ? commits.reduce((acc, commit) => {
        const dateStr = commit.created_at.toISOString().split("T")[0];
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        if (commit.user_login) {
          const user = activityData.users[commit.user_login];
          const existingAuthor = acc[dateStr].find(author => author.login === commit.user_login);
          if (!existingAuthor) {
            acc[dateStr].push({
              login: commit.user_login,
              name: user?.name
            });
          }
        }
        return acc;
      }, {} as Record<string, { login: string; name?: string }[]>)
    : {};

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