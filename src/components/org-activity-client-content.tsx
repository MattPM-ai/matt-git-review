"use client";

import { useEffect, useState } from "react";
import { useValidatedSession } from "@/hooks/useValidatedSession";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ActivityFilters } from "@/components/activity-filters";
import { ActivityContent } from "@/components/activity-content";
import {
  mattAPI,
  type ActivityFilterDto,
  type ActivitiesResponseDto,
} from "@/lib/matt-api";

interface OrgActivityClientContentProps {
  orgName: string;
  searchParams: {
    user?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function OrgActivityClientContent({
  orgName,
  searchParams,
}: OrgActivityClientContentProps) {
  const { data: session, status } = useValidatedSession();
  const [activityData, setActivityData] =
    useState<ActivitiesResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log("session", session);

  const {
    user: selectedUser,
    type: selectedType,
    dateFrom: selectedDateFrom,
    dateTo: selectedDateTo,
  } = searchParams;

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
          const typeMap: Record<string, ("commit" | "issue" | "pull")[]> = {
            commits: ["commit"],
            issues: ["issue"],
            pulls: ["pull"],
          };
          filter.activityTypes = typeMap[selectedType] || [
            "commit",
            "issue",
            "pull",
          ];
        }

        // Fetch activities from Matt API
        const data = await mattAPI.fetchActivities(
          session.mattJwtToken,
          filter
        );

        // Sort activities by date
        data.activities.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB.getTime() - dateA.getTime();
        });

        setActivityData(data);
        console.log("activity", data);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setError("Failed to fetch organization data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [
    session,
    status,
    orgName,
    selectedUser,
    selectedType,
    selectedDateFrom,
    selectedDateTo,
  ]);

  const members = activityData ? Object.values(activityData.users) : [];
  const allActivities = activityData ? activityData.activities : [];
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

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading activities...</p>
          </div>
        </div>
      ) : (
        <ActivityContent
          allActivities={allActivities}
          users={activityData?.users || {}}
          repositories={activityData?.repositories || {}}
          selectedUser={selectedUser}
          selectedType={selectedType}
          selectedDateFrom={selectedDateFrom}
        />
      )}
    </DashboardLayout>
  );
}
