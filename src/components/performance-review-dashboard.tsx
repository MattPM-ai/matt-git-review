"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { UserDetailedView } from "./user-detailed-view";
import { MobileModal } from "./mobile-modal";
import { ShareModal } from "./share-modal";
import { DateRangePicker, type PeriodType } from "./date-range-picker";
import { TaskLoadingState } from "./task-loading-state";
import { useStandupData } from "@/hooks/useStandupData";

interface PerformanceReviewDashboardProps {
  orgName: string;
  initialPeriod?: PeriodType;
  initialDateFrom?: string;
  initialDateTo?: string;
}

interface PerformanceData {
  username: string;
  name: string;
  avatar_url: string;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalActivities: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
  avgManHours: number;
  activeDays: number;
  workDone: string[];
  workingOn: string[];
  ongoingIssues: string[];
  manHoursRationale: string;
  dailyStandups?: Array<{
    date?: Date;
    summary: string;
    workDone: string[];
    workingOn: string[];
    ongoingIssues: string[];
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    totalManHoursMin: number;
    totalManHoursMax: number;
    manHoursRationale: string;
  }>;
}

export function PerformanceReviewDashboard({
  orgName,
  initialPeriod = "weekly",
  initialDateFrom,
  initialDateTo,
}: PerformanceReviewDashboardProps) {
  const [period, setPeriod] = useState<PeriodType>(initialPeriod);
  const periodRef = useRef<PeriodType>(initialPeriod);

  // Keep ref in sync with state
  useEffect(() => {
    periodRef.current = period;
  }, [period]);

  const getDefaultDateRange = () => {
    const today = new Date();
    const defaultStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const defaultEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

    return {
      dateFrom: initialDateFrom || format(defaultStart, "yyyy-MM-dd"),
      dateTo: initialDateTo || format(defaultEnd, "yyyy-MM-dd"),
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [hasGeneratedReport, setHasGeneratedReport] = useState(false);

  const {
    standupData,
    isLoading,
    error,
    noActivity,
    currentTask,
    fetchStandupData,
  } = useStandupData({
    organizationLogin: orgName,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });
  const [selectedUser, setSelectedUser] = useState<PerformanceData | null>(
    null
  );
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleCloseModal = useCallback(() => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setIsModalClosing(false);
    }, 300); // Match animation duration
  }, []);

  // Unified URL update function
  const updateURL = useCallback(
    (
      updatedPeriod: PeriodType,
      updatedDateRange: { dateFrom: string; dateTo: string }
    ) => {
      const url = new URL(window.location.href);
      url.searchParams.set("period", updatedPeriod);
      url.searchParams.set("dateFrom", updatedDateRange.dateFrom);
      url.searchParams.set("dateTo", updatedDateRange.dateTo);
      window.history.pushState({}, "", url.toString());
    },
    []
  );

  const handlePeriodChange = useCallback(
    (newPeriod: PeriodType) => {
      setPeriod(newPeriod);
      periodRef.current = newPeriod; // Update ref immediately

      // Hide detailed view when period changes
      setSelectedUser(null);

      // Update URL with new period and current date range
      updateURL(newPeriod, dateRange);
    },
    [dateRange, updateURL]
  );

  const handleDateRangeChange = useCallback(
    (newDateRange: { dateFrom: string; dateTo: string }) => {
      setDateRange(newDateRange);

      // Hide detailed view when date range changes
      setSelectedUser(null);

      // Reset report generation state when date changes
      if (hasGeneratedReport) {
        setHasGeneratedReport(false);
      }

      // Update URL with current period (from ref to get latest value) and new date range
      updateURL(periodRef.current, newDateRange);

      // Don't auto-fetch data, wait for user to generate report
    },
    [updateURL, hasGeneratedReport]
  );

  const handleGenerateReport = useCallback(() => {
    setHasGeneratedReport(true);
    fetchStandupData({
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
    });
  }, [fetchStandupData, dateRange]);

  // Transform standup data into performance data whenever standupData changes
  useEffect(() => {
    if (standupData.length > 0) {
      const performanceMetrics: PerformanceData[] = standupData.map((user) => {
        const avgManHours =
          (user.standup.totalManHoursMin + user.standup.totalManHoursMax) / 2;

        // Calculate active days based on the length of dailyStandups array
        const activeDays = user.standup.dailyStandups
          ? user.standup.dailyStandups.length
          : 1;

        const totalActivities =
          user.standup.totalCommits +
          user.standup.totalPRs +
          user.standup.totalIssues;

        return {
          username: user.username,
          name: user.name,
          avatar_url: user.avatar_url,
          totalCommits: user.standup.totalCommits,
          totalPRs: user.standup.totalPRs,
          totalIssues: user.standup.totalIssues,
          totalActivities,
          totalManHoursMin: user.standup.totalManHoursMin,
          totalManHoursMax: user.standup.totalManHoursMax,
          avgManHours,
          activeDays,
          workDone: user.standup.workDone,
          workingOn: user.standup.workingOn,
          ongoingIssues: user.standup.ongoingIssues,
          manHoursRationale: user.standup.manHoursRationale,
          dailyStandups: user.standup.dailyStandups,
        };
      });

      // Sort by average man hours descending
      performanceMetrics.sort((a, b) => b.avgManHours - a.avgManHours);

      setPerformanceData(performanceMetrics);
    } else {
      setPerformanceData([]);
    }
  }, [standupData]);

  // No initial data fetch - wait for user to generate report

  return (
    <div className="flex flex-col h-full pb-6">
      {/* Header with controls - only show after report generation */}
      {hasGeneratedReport && (
        <div className="flex-shrink-0 space-y-4 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Performance & Standup
              </h1>
              <p className="text-sm text-gray-600">
                {format(new Date(dateRange.dateFrom), "MMM d")} -{" "}
                {format(new Date(dateRange.dateTo), "MMM d, yyyy")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <DateRangePicker
                period={period}
                dateFrom={dateRange.dateFrom}
                dateTo={dateRange.dateTo}
                onPeriodChange={handlePeriodChange}
                onDateRangeChange={handleDateRangeChange}
                disabled={isLoading}
                className="flex-1"
                shareButton={
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors hover:cursor-pointer"
                    title="Share report"
                  >
                    <svg fill="#000000" viewBox="-2 -2 24 24" className="w-5 h-5">
                      <path d="M16 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.928 9.24a4.02 4.02 0 0 1-.026 1.644l5.04 2.537a4 4 0 1 1-.867 1.803l-5.09-2.562a4 4 0 1 1 .083-5.228l5.036-2.522a4 4 0 1 1 .929 1.772L7.928 9.24zM4 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                    </svg>
                  </button>
                }
              />
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors hover:cursor-pointer"
                title="Share report"
              >
                <svg fill="#000000" viewBox="-2 -2 24 24" className="w-5 h-5">
                  <path d="M16 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.928 9.24a4.02 4.02 0 0 1-.026 1.644l5.04 2.537a4 4 0 1 1-.867 1.803l-5.09-2.562a4 4 0 1 1 .083-5.228l5.036-2.522a4 4 0 1 1 .929 1.772L7.928 9.24zM4 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {noActivity && !isLoading && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    No activity found for this period (
                    {format(new Date(dateRange.dateFrom), "MMM d")} -{" "}
                    {format(new Date(dateRange.dateTo), "MMM d, yyyy")})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main content - flex-1 to fill remaining height */}
      {!hasGeneratedReport ? (
        // Initial date selection UI - centered on page
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Performance & Standup
              </h2>
              <p className="text-gray-600 mb-6">
                Choose a date range to generate a comprehensive performance and
                standup report for your team.
              </p>
            </div>

            <div className="space-y-4">
              <DateRangePicker
                period={period}
                dateFrom={dateRange.dateFrom}
                dateTo={dateRange.dateTo}
                onPeriodChange={handlePeriodChange}
                onDateRangeChange={handleDateRangeChange}
                disabled={false}
                className="w-full"
              />

              <button
                onClick={handleGenerateReport}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <TaskLoadingState task={currentTask} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ranking Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-1 flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Performance Ranking
              </h2>
              <p className="text-sm text-gray-500">
                Select any member to view detailed metrics
              </p>
            </div>

            {noActivity ? (
              <div className="flex-1 flex items-center justify-center px-4 py-8 text-center">
                <div>
                  <div className="mb-4">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    No Activity Found
                  </p>
                  <p className="text-sm text-gray-500">
                    There was no development activity during this period.
                    <br />
                    Try selecting a different date range.
                  </p>
                </div>
              </div>
            ) : performanceData.length > 0 ? (
              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {performanceData.map((user, index) => (
                    <div
                      key={user.username}
                      onClick={() => setSelectedUser(user)}
                      className={`relative cursor-pointer transition-colors ${
                        selectedUser?.username === user.username
                          ? "bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500 w-6">
                            #{index + 1}
                          </span>
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-8 h-8 rounded-full"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name || user.username}
                            </p>
                            <span className="text-xs text-gray-500">
                              @{user.username}
                            </span>
                          </div>

                          {/* Average hours with inline progress bar */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 font-medium whitespace-nowrap w-24">
                              {user.avgManHours.toFixed(1)} man-hours
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    (user.avgManHours /
                                      Math.max(
                                        ...performanceData.map(
                                          (u) => u.avgManHours
                                        )
                                      )) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active indicator */}
                      {selectedUser?.username === user.username && (
                        <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center px-4 py-8 text-center text-gray-500">
                <p>No performance data available for this period.</p>
              </div>
            )}
          </div>

          {/* Detailed View Section - Hidden on mobile */}
          <div className="hidden lg:flex lg:flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
            <UserDetailedView selectedUser={selectedUser} />
          </div>
        </div>
      )}

      {/* Mobile Modal for Detailed View */}
      <MobileModal
        selectedUser={selectedUser}
        isModalClosing={isModalClosing}
        onClose={handleCloseModal}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
