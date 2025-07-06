"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import Image from "next/image";
import type { GitHubCommit, GitHubIssue, GitHubPullRequest, ActivityWithType } from "@/lib/github-api";

function ActivityItem({
  item,
  type,
}: {
  item: GitHubCommit | GitHubIssue | GitHubPullRequest;
  type: string;
}) {
  const getIcon = () => {
    switch (type) {
      case "commits":
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "issues":
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
      case "pulls":
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        );
    }
  };

  const getDate = () => {
    if (type === "commits") {
      return new Date(
        (item as GitHubCommit).commit.author.date
      ).toLocaleDateString();
    }
    return new Date(
      (item as GitHubIssue | GitHubPullRequest).created_at
    ).toLocaleDateString();
  };

  const getTitle = () => {
    if (type === "commits") {
      return (item as GitHubCommit).commit.message.split("\n")[0];
    }
    return (item as GitHubIssue | GitHubPullRequest).title;
  };

  const getAuthor = () => {
    if (type === "commits") {
      const commitItem = item as GitHubCommit;
      return commitItem.author?.login || commitItem.commit.author.name;
    }
    return (item as GitHubIssue | GitHubPullRequest).user.login;
  };

  const getAuthorAvatar = () => {
    if (type === "commits") {
      return (item as GitHubCommit).author?.avatar_url || "";
    }
    return (item as GitHubIssue | GitHubPullRequest).user.avatar_url || "";
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
            href={item.repository.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            {item.repository.name}
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
        {type !== "commits" && (
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                (item as GitHubIssue | GitHubPullRequest).state === "open"
                  ? "bg-green-100 text-green-800"
                  : (item as GitHubIssue | GitHubPullRequest).state === "closed"
                  ? "bg-red-100 text-red-800"
                  : "bg-purple-100 text-purple-800"
              }`}
            >
              {(item as GitHubIssue | GitHubPullRequest).state}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityContentProps {
  allActivities: ActivityWithType[];
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
  selectedType,
  selectedDateFrom,
}: ActivityContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadedDates, setLoadedDates] = useState<DateLoadState[]>([]);
  const [, setStartFromDateIndex] = useState(0);

  // Filter activities based on type
  const filteredActivities = useMemo(() => 
    selectedType
      ? allActivities.filter((activity) => activity.type === selectedType)
      : allActivities,
    [allActivities, selectedType]
  );

  // Group all activities by date first
  const activitiesByDate = useMemo(() => 
    filteredActivities.reduce((acc, activity) => {
      const date = activity.type === "commits"
        ? (activity as GitHubCommit & { type: "commits" }).commit.author.date.split('T')[0]
        : (activity as (GitHubIssue | GitHubPullRequest) & { type: string }).created_at.split('T')[0];
      
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, ActivityWithType[]>),
    [filteredActivities]
  );

  // Get sorted dates (newest first)
  const sortedDates = useMemo(() => 
    Object.keys(activitiesByDate)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()),
    [activitiesByDate]
  );

  // Function to determine initial dates to load (aim for ~20-50 activities)
  const getInitialDatesToLoad = useCallback((dates: string[], startIndex: number): DateLoadState[] => {
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
        totalCount: activitiesOnDate
      });
      
      totalActivities += loadedCount;
      
      // If we have a reasonable amount, stop (but always include at least one date)
      if (totalActivities >= 20 && datesToLoad.length > 0) {
        break;
      }
    }
    
    return datesToLoad;
  }, [activitiesByDate]);

  // Function to load more dates
  const getMoreDatesToLoad = (currentDates: DateLoadState[], direction: 'newer' | 'older'): DateLoadState[] => {
    const currentDateStrings = new Set(currentDates.map(d => d.date));
    
    if (direction === 'newer') {
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
        
        newDates.unshift({ // Add to beginning
          date,
          loadedCount,
          totalCount: activitiesOnDate
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
          totalCount: activitiesOnDate
        });
        totalActivities += loadedCount;
        
        if (totalActivities >= 20) break;
      }
      
      return [...currentDates, ...newDates];
    }
  };

  // Function to load more activities for a specific date
  const loadMoreForDate = (targetDate: string) => {
    setLoadedDates(prev => prev.map(dateState => {
      if (dateState.date === targetDate) {
        const newLoadedCount = Math.min(
          dateState.totalCount,
          dateState.loadedCount + 50
        );
        return {
          ...dateState,
          loadedCount: newLoadedCount
        };
      }
      return dateState;
    }));
  };

  // Reset display when filters change
  useEffect(() => {
    if (selectedDateFrom) {
      // Find the index of the target date
      const targetDateIndex = sortedDates.findIndex(date => date <= selectedDateFrom);
      
      if (targetDateIndex !== -1) {
        setStartFromDateIndex(targetDateIndex);
        // Load initial dates starting from target date
        const initialDates = getInitialDatesToLoad(sortedDates, targetDateIndex);
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
  const uniqueLoadedDates = loadedDates.filter((dateState, index, self) => 
    index === self.findIndex(d => d.date === dateState.date)
  );

  // Get displayed activities based on loaded dates
  
  const canLoadNewer = uniqueLoadedDates.length > 0 && 
    sortedDates.indexOf(uniqueLoadedDates[uniqueLoadedDates.length - 1]?.date) > 0;
  
  const hasMoreToLoad = uniqueLoadedDates.length > 0 && 
    sortedDates.indexOf(uniqueLoadedDates[0]?.date) < sortedDates.length - 1;

  const handleLoadNewer = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('dateFrom');
    router.push(`?${params.toString()}`);
  };

  const handleLoadMore = () => {
    const newDates = getMoreDatesToLoad(loadedDates, 'older');
    setLoadedDates(newDates);
  };

  // Get activities grouped by the loaded dates with proper count limits
  // Use the latest state for each date (in case of duplicates)
  const displayedActivitiesByDate = uniqueLoadedDates.reduce((acc, dateState) => {
    if (activitiesByDate[dateState.date]) {
      // Always use the latest loadedCount for this date
      acc[dateState.date] = {
        activities: activitiesByDate[dateState.date].slice(0, dateState.loadedCount),
        hasMore: dateState.loadedCount < dateState.totalCount,
        totalCount: dateState.totalCount,
        loadedCount: dateState.loadedCount
      };
    }
    return acc;
  }, {} as Record<string, {
    activities: ActivityWithType[];
    hasMore: boolean;
    totalCount: number;
    loadedCount: number;
  }>);

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No activity found</h3>
        <p className="text-gray-500">
          No activity found for the selected filters. Try adjusting your filters or date range.
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
            Starting from {format(new Date(selectedDateFrom), 'MMM d, yyyy')}
          </div>
        )}
      </div>

      {/* Load Newer Button */}
      {canLoadNewer && (
        <div className="mb-6">
          <button
            onClick={handleLoadNewer}
            className="w-full py-3 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Load More Recent Activity
          </button>
        </div>
      )}

      <div className="space-y-6">
        {uniqueLoadedDates.map(dateState => {
          const dateData = displayedActivitiesByDate[dateState.date];
          if (!dateData) return null;
          
          return (
            <div key={dateState.date}>
              {/* Date Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-lg font-medium text-gray-900">
                    {format(new Date(dateState.date), 'EEEE, MMMM d, yyyy')}
                    {dateData.totalCount > dateData.loadedCount && (
                      <span className="ml-2 text-sm text-gray-500">
                        (showing {dateData.loadedCount} of {dateData.totalCount})
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
                        "id" in item ? item.id : (item as GitHubCommit).sha
                      }-${index}`}
                      item={item}
                      type={item.type}
                    />
                  ))}
                </div>
                
                {/* Load more for this date if needed */}
                {dateData.hasMore && (
                  <div className="p-4 border-t border-gray-200 bg-gray-100">
                    <button
                      onClick={() => loadMoreForDate(dateState.date)}
                      className="w-full py-2 px-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-gray-700 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Load {Math.min(50, dateData.totalCount - dateData.loadedCount)} More from This Date
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
            className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Load Older Activity
          </button>
        </div>
      )}
    </div>
  );
}