"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { UserDetailedView } from "./user-detailed-view";
import { MobileModal } from "./mobile-modal";
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
  const dataFetchedRef = useRef(false);
  
  const {
    standupData,
    isLoading,
    error,
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

  const handleCloseModal = useCallback(() => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setIsModalClosing(false);
    }, 300); // Match animation duration
  }, []);

  const handlePeriodChange = useCallback(
    (newPeriod: PeriodType) => {
      setPeriod(newPeriod);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("period", newPeriod);
      url.searchParams.set("dateFrom", dateRange.dateFrom);
      url.searchParams.set("dateTo", dateRange.dateTo);
      window.history.pushState({}, "", url.toString());
    },
    [dateRange]
  );

  const handleDateRangeChange = useCallback(
    (newDateRange: { dateFrom: string; dateTo: string }) => {
      setDateRange(newDateRange);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set("period", period);
      url.searchParams.set("dateFrom", newDateRange.dateFrom);
      url.searchParams.set("dateTo", newDateRange.dateTo);
      window.history.pushState({}, "", url.toString());
      
      // Fetch data after date range change with the new range
      fetchStandupData({
        dateFrom: newDateRange.dateFrom,
        dateTo: newDateRange.dateTo,
      });
    },
    [period, fetchStandupData]
  );

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

  // Only fetch data on initial load when orgName is available
  useEffect(() => {
    if (orgName && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchStandupData();
    }
  }, [orgName, fetchStandupData]);

  return (
    <div className="flex flex-col h-full pb-6">
      {/* Header with controls */}
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

          <DateRangePicker
            period={period}
            dateFrom={dateRange.dateFrom}
            dateTo={dateRange.dateTo}
            onPeriodChange={handlePeriodChange}
            onDateRangeChange={handleDateRangeChange}
            disabled={isLoading}
            className="flex-shrink-0"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Main content - flex-1 to fill remaining height */}
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

          {isLoading ? (
            <TaskLoadingState task={currentTask} />
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

      {/* Mobile Modal for Detailed View */}
      <MobileModal
        selectedUser={selectedUser}
        isModalClosing={isModalClosing}
        onClose={handleCloseModal}
      />
    </div>
  );
}
