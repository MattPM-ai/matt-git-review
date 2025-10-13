"use client";

import { useEffect, useState } from "react";
import { useValidatedSession } from "@/hooks/useValidatedSession";
import { useOrgConfig } from "@/hooks/use-org-config";
import { DashboardLayout } from "@/components/dashboard-layout";
import { StandupDashboard } from "@/components/standup-dashboard";
import { StandupSidebar } from "@/components/standup-sidebar";
import { mattAPI, type ActivityFilterDto, type ActivitiesResponseDto } from "@/lib/matt-api";

interface OrgStandupClientContentProps {
  orgName: string;
  searchParams: {
    dateFrom?: string;
    dateTo?: string;
  };
}

export function OrgStandupClientContent({
  orgName: orgLogin,
  searchParams,
}: OrgStandupClientContentProps) {
  const { data: session, status } = useValidatedSession();
  const { orgName } = useOrgConfig(orgLogin);
  const [activityData, setActivityData] = useState<ActivitiesResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { dateFrom } = searchParams;

  useEffect(() => {
    const fetchActivities = async () => {
      // Wait for session to be loaded
      if (status === "loading") {
        return;
      }

      // Only fetch data if we have a valid session with mattJwtToken
      if (!session?.mattJwtToken) {
        setIsLoading(false);
        if (session) {
          // We have a session but no mattJwtToken - this is an error
          setError("Authentication token missing. Please sign in again.");
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Build filter to fetch only commits for calendar/sidebar data
        const filter: ActivityFilterDto = {
          organizationLogin: orgLogin,
          activityTypes: ["commit"],
          limit: 1000, // Get a reasonable amount of commits
        };

        // Add date filter if provided
        if (dateFrom) {
          filter.dateFrom = dateFrom;
        }

        // Fetch activities from Matt API for sidebar data
        const data = await mattAPI.fetchActivities(session.mattJwtToken, filter);
        setActivityData(data);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setError("Failed to fetch organization data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [session, status, orgLogin, dateFrom]);

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
      orgLogin={orgLogin}
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading standup data...</p>
          </div>
        </div>
      ) : (
        <StandupDashboard
          members={members}
          commitDates={commitDates}
          selectedDate={dateFrom}
          orgName={orgName}
          dailyCommitAuthors={dailyCommitAuthors}
        />
      )}
    </DashboardLayout>
  );
}