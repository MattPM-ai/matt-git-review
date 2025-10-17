"use client";

import { useEffect, useState } from "react";
import { useValidatedSession } from "@/hooks/useValidatedSession";
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
  orgName: orgLogin,
  searchParams,
}: OrgActivityClientContentProps) {
  const { data: session, status } = useValidatedSession();
  const [activityData, setActivityData] =
    useState<ActivitiesResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          organizationLogin: orgLogin,
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
    orgLogin,
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
    <div className="flex flex-col lg:flex-row h-full -mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      {/* Sidebar */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 lg:p-6">
          <ActivityFilters
            members={members}
            selectedUser={selectedUser}
            selectedType={selectedType}
            selectedDateFrom={selectedDateFrom}
            selectedDateTo={selectedDateTo}
            commitDates={commitDates}
            allActivities={allActivities}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">
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
        </div>
      </div>
    </div>
  );
}
