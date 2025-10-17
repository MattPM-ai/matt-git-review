"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import type {
  SimplifiedActivityDto,
  ActivitiesResponseDto,
} from "@/lib/api";
import { ChevronDown, ChevronUp, ClipboardList, GitPullRequestArrow, CircleAlert, GitCommitHorizontal } from "lucide-react";
import GithubIcon from "@/components/Icon/github";

function ActivityItem({
  item,
  users,
  repositories,
}: {
  item: SimplifiedActivityDto;
  users: ActivitiesResponseDto["users"];
  repositories: ActivitiesResponseDto["repositories"];
}) {
  const user = users[item.user_login || ""];
  const repository = repositories[item.repository_full_name || ""];

  const getIcon = () => {
    switch (item.type) {
      case "commit":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <GitCommitHorizontal className="w-4 h-4 text-green-600" />
          </div>
        );
      case "issue":
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <CircleAlert className="w-4 h-4 text-red-600" />
          </div>
        );
      case "pull":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <GitPullRequestArrow className="w-4 h-4 text-blue-600" />
          </div>
        );
    }
  };

  const getDate = () => {
    return item.created_at.toLocaleString();
  };

  const getTitle = () => {
    return item.title;
  };

  const getAuthor = () => {
    return user?.name || item.user_login || "Unknown";
  };

  const getAuthorAvatar = () => {
    return user?.avatar_url || "";
  };

  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-200 hover:bg-gray-50">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getAuthorAvatar() && (
            <Image
              src={getAuthorAvatar()}
              alt={getAuthor()}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-900">
            {getAuthor()}
          </span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">{getDate()}</span>
          <span className="text-sm text-gray-500">•</span>
          <a
            href={repository?.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <GithubIcon className="w-4 h-4" />
            {repository?.name}
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
        {item.type !== "commit" && "state" in item && (
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

interface ActivityContentProps {
  allActivities: SimplifiedActivityDto[];
  users: ActivitiesResponseDto["users"];
  repositories: ActivitiesResponseDto["repositories"];
  selectedUser?: string;
  selectedType?: string;
  selectedDateFrom?: string;
}

interface DateLoadState {
  date: string;
  loadedCount: number;
  totalCount: number;
}

export function ActivityContent({
  allActivities,
  users,
  repositories,
  selectedType,
  selectedDateFrom,
}: ActivityContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadedDates, setLoadedDates] = useState<DateLoadState[]>([]);
  const [, setStartFromDateIndex] = useState(0);

  // Filter activities based on type
  const filteredActivities = useMemo(
    () =>
      selectedType
        ? allActivities.filter((activity) => activity.type === selectedType)
        : allActivities,
    [allActivities, selectedType]
  );

  // Group all activities by date first
  const activitiesByDate = useMemo(
    () =>
      filteredActivities.reduce((acc, activity) => {
        const date: string = activity.created_at.toISOString().split("T")[0];

        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
      }, {} as Record<string, SimplifiedActivityDto[]>),
    [filteredActivities]
  );

  // Get sorted dates (newest first)
  const sortedDates = useMemo(
    () =>
      Object.keys(activitiesByDate).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      ),
    [activitiesByDate]
  );

  // Function to determine initial dates to load (aim for ~20-50 activities)
  const getInitialDatesToLoad = useCallback(
    (dates: string[], startIndex: number): DateLoadState[] => {
      const datesToLoad: DateLoadState[] = [];
      let totalActivities = 0;

      for (let i = startIndex; i < dates.length; i++) {
        const date = dates[i];
        const activitiesOnDate = activitiesByDate[date].length;

        // For dates with 100+ activities, only load first 50
        const loadedCount = activitiesOnDate > 100 ? 50 : activitiesOnDate;

        datesToLoad.push({
          date,
          loadedCount,
          totalCount: activitiesOnDate,
        });

        totalActivities += loadedCount;

        // If we have a reasonable amount, stop (but always include at least one date)
        if (totalActivities >= 20 && datesToLoad.length > 0) {
          break;
        }
      }

      return datesToLoad;
    },
    [activitiesByDate]
  );

  // Function to load more dates
  const getMoreDatesToLoad = (
    currentDates: DateLoadState[],
    direction: "newer" | "older"
  ): DateLoadState[] => {
    const currentDateStrings = new Set(currentDates.map((d) => d.date));

    if (direction === "newer") {
      // Load newer dates (before the earliest currently loaded date)
      const earliestLoadedDate = currentDates[currentDates.length - 1]?.date;
      if (!earliestLoadedDate) return currentDates;

      const earliestIndex = sortedDates.indexOf(earliestLoadedDate);

      if (earliestIndex <= 0) return currentDates; // No newer dates

      // Load previous dates (newer)
      const newDates: DateLoadState[] = [];
      let totalActivities = 0;

      for (let i = earliestIndex - 1; i >= 0; i--) {
        const date = sortedDates[i];

        // Skip if already loaded
        if (currentDateStrings.has(date)) continue;

        const activitiesOnDate = activitiesByDate[date].length;
        const loadedCount = activitiesOnDate > 100 ? 50 : activitiesOnDate;

        newDates.unshift({
          // Add to beginning
          date,
          loadedCount,
          totalCount: activitiesOnDate,
        });
        totalActivities += loadedCount;

        if (totalActivities >= 20) break;
      }

      return [...newDates, ...currentDates];
    } else {
      // Load older dates (after the latest currently loaded date)
      const latestLoadedDate = currentDates[0]?.date;
      if (!latestLoadedDate) return currentDates;

      const latestIndex = sortedDates.indexOf(latestLoadedDate);

      if (latestIndex >= sortedDates.length - 1) return currentDates; // No older dates

      // Load next dates (older)
      const newDates: DateLoadState[] = [];
      let totalActivities = 0;

      for (let i = latestIndex + 1; i < sortedDates.length; i++) {
        const date = sortedDates[i];

        // Skip if already loaded
        if (currentDateStrings.has(date)) continue;

        const activitiesOnDate = activitiesByDate[date].length;
        const loadedCount = activitiesOnDate > 100 ? 50 : activitiesOnDate;

        newDates.push({
          date,
          loadedCount,
          totalCount: activitiesOnDate,
        });
        totalActivities += loadedCount;

        if (totalActivities >= 20) break;
      }

      return [...currentDates, ...newDates];
    }
  };

  // Function to load more activities for a specific date
  const loadMoreForDate = (targetDate: string) => {
    setLoadedDates((prev) =>
      prev.map((dateState) => {
        if (dateState.date === targetDate) {
          const newLoadedCount = Math.min(
            dateState.totalCount,
            dateState.loadedCount + 50
          );
          return {
            ...dateState,
            loadedCount: newLoadedCount,
          };
        }
        return dateState;
      })
    );
  };

  // Reset display when filters change
  useEffect(() => {
    if (selectedDateFrom) {
      // Find the index of the target date
      const targetDateIndex = sortedDates.findIndex(
        (date) => date <= selectedDateFrom
      );

      if (targetDateIndex !== -1) {
        setStartFromDateIndex(targetDateIndex);
        // Load initial dates starting from target date
        const initialDates = getInitialDatesToLoad(
          sortedDates,
          targetDateIndex
        );
        setLoadedDates(initialDates);
      } else {
        // Date not found, start from beginning
        const initialDates = getInitialDatesToLoad(sortedDates, 0);
        setLoadedDates(initialDates);
        setStartFromDateIndex(0);
      }
    } else {
      // Default: load initial dates from the beginning
      const initialDates = getInitialDatesToLoad(sortedDates, 0);
      setLoadedDates(initialDates);
      setStartFromDateIndex(0);
    }
  }, [selectedType, selectedDateFrom, sortedDates, getInitialDatesToLoad]);

  // Get unique dates in order for rendering (remove duplicates)
  const uniqueLoadedDates = loadedDates.filter(
    (dateState, index, self) =>
      index === self.findIndex((d) => d.date === dateState.date)
  );

  // Get displayed activities based on loaded dates

  const canLoadNewer =
    uniqueLoadedDates.length > 0 &&
    sortedDates.indexOf(uniqueLoadedDates[uniqueLoadedDates.length - 1]?.date) >
      0;

  const hasMoreToLoad =
    uniqueLoadedDates.length > 0 &&
    sortedDates.indexOf(uniqueLoadedDates[0]?.date) < sortedDates.length - 1;

  const handleLoadNewer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("dateFrom");
    router.push(`?${params.toString()}`);
  };

  const handleLoadMore = () => {
    const newDates = getMoreDatesToLoad(loadedDates, "older");
    setLoadedDates(newDates);
  };

  // Get activities grouped by the loaded dates with proper count limits
  // Use the latest state for each date (in case of duplicates)
  const displayedActivitiesByDate = uniqueLoadedDates.reduce(
    (acc, dateState) => {
      if (activitiesByDate[dateState.date]) {
        // Always use the latest loadedCount for this date
        acc[dateState.date] = {
          activities: activitiesByDate[dateState.date].slice(
            0,
            dateState.loadedCount
          ),
          hasMore: dateState.loadedCount < dateState.totalCount,
          totalCount: dateState.totalCount,
          loadedCount: dateState.loadedCount,
        };
      }
      return acc;
    },
    {} as Record<
      string,
      {
        activities: SimplifiedActivityDto[];
        hasMore: boolean;
        totalCount: number;
        loadedCount: number;
      }
    >
  );

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No activity found
        </h3>
        <p className="text-gray-500">
          No activity found for the selected filters. Try adjusting your filters
          or date range.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          Activity Feed
          <span className="ml-2 text-lg text-gray-500">
            ({filteredActivities.length} total)
          </span>
        </h3>

        {selectedDateFrom && (
          <div className="text-sm text-gray-500">
            Starting from {format(new Date(selectedDateFrom), "MMM d, yyyy")}
          </div>
        )}
      </div>

      {/* Load Newer Button */}
      {canLoadNewer && (
        <div className="mb-6">
          <button
            onClick={handleLoadNewer}
            className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-medium transition-colors duration-200 flex items-center justify-center gap-2 hover:cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
            Load More Recent Activity
          </button>
        </div>
      )}

      <div className="space-y-6">
        {uniqueLoadedDates.map((dateState) => {
          const dateData = displayedActivitiesByDate[dateState.date];
          if (!dateData) return null;

          return (
            <div key={dateState.date}>
              {/* Date Separator */}
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-lg font-medium text-gray-900">
                    {format(new Date(dateState.date), "EEEE, MMMM d, yyyy")}
                    {dateData.totalCount > dateData.loadedCount && (
                      <span className="ml-2 text-sm text-gray-500">
                        (showing {dateData.loadedCount} of {dateData.totalCount}
                        )
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Activities for this date */}
              <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="divide-y divide-gray-200">
                  {dateData.activities.map((item, index) => (
                    <ActivityItem
                      key={`${item.type}-${
                        item.type === "commit" ? item.sha : item.id
                      }-${index}`}
                      item={item}
                      users={users}
                      repositories={repositories}
                    />
                  ))}
                </div>

                {/* Load more for this date if needed */}
                {dateData.hasMore && (
                  <div className="p-4 border-t border-gray-200 bg-gray-100">
                    <button
                      onClick={() => loadMoreForDate(dateState.date)}
                      className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-700 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 hover:cursor-pointer"
                    >

                      <ChevronDown className="w-4 h-4" />
                      Load{" "}
                      {Math.min(50, dateData.totalCount - dateData.loadedCount)}{" "}
                      More from This Date
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMoreToLoad && (
        <div className="mt-6">
          <button
            onClick={handleLoadMore}
            className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-medium transition-colors duration-200 flex items-center justify-center gap-2 hover:cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
            Load Older Activity
          </button>
        </div>
      )}
    </div>
  );
}
