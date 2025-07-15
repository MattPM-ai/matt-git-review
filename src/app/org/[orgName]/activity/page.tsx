import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ActivityFilters } from "@/components/activity-filters";
import { ActivityContent } from "@/components/activity-content";
import { mattAPI, type ActivityFilterDto, type ActivitiesResponseDto } from "@/lib/matt-api";

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

  let activityData: ActivitiesResponseDto | null = null;
  let error = null;

  try {
    // Build filter for API request
    const filter: ActivityFilterDto = {
      organizationLogin: orgName,
      limit: 1000, // Get a reasonable amount of activities
    };

    // Add optional filters
    if (selectedUser) {
      filter.usernames = [selectedUser];
    }
    if (selectedDateFrom) {
      filter.dateFrom = selectedDateFrom;
    }
    if (selectedDateTo) {
      filter.dateTo = selectedDateTo;
    }
    if (selectedType) {
      const typeMap: Record<string, ('commit' | 'issue' | 'pull')[]> = {
        commits: ['commit'],
        issues: ['issue'],
        pulls: ['pull'],
      };
      filter.activityTypes = typeMap[selectedType] || ['commit', 'issue', 'pull'];
    }

    // Fetch activities from Matt API
    activityData = await mattAPI.fetchActivities(session.accessToken!, filter);

    // Sort activities by date
    activityData.activities.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    console.log("activity", activityData);
  } catch (err) {
    console.error("Failed to fetch activities:", err);
    error = "Failed to fetch organization data";
  }

  const members = activityData ? Object.values(activityData.users) : [];
  const allActivities = activityData ? activityData.activities : [];
  const commitDates = activityData ? 
    Array.from(new Set(activityData.activities
      .filter(a => a.type === 'commit')
      .map(a => a.created_at.toISOString().split('T')[0])
    )).sort().reverse() : [];

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
        users={activityData?.users || {}}
        repositories={activityData?.repositories || {}}
        selectedUser={selectedUser}
        selectedType={selectedType}
        selectedDateFrom={selectedDateFrom}
      />
    </DashboardLayout>
  );
}