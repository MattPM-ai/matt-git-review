"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
} from "date-fns";
import type { StandupResponse } from "@/lib/matt-api";

interface PerformanceReviewDashboardProps {
  orgName: string;
  initialPeriod?: "daily" | "weekly" | "monthly";
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
  manHoursRationale: string;
}

export function PerformanceReviewDashboard({
  orgName,
  initialPeriod = "weekly",
  initialDateFrom,
}: PerformanceReviewDashboardProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    initialPeriod
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDateFrom ||
      format(
        startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      )
  );
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const calculateDateRange = useCallback(
    (date: string, periodType: "daily" | "weekly" | "monthly") => {
      const baseDate = new Date(date);

      switch (periodType) {
        case "daily":
          return {
            dateFrom: format(baseDate, "yyyy-MM-dd"),
            dateTo: format(baseDate, "yyyy-MM-dd"),
          };
        case "weekly":
          return {
            dateFrom: format(
              startOfWeek(baseDate, { weekStartsOn: 1 }),
              "yyyy-MM-dd"
            ),
            dateTo: format(
              endOfWeek(baseDate, { weekStartsOn: 1 }),
              "yyyy-MM-dd"
            ),
          };
        case "monthly":
          return {
            dateFrom: format(startOfMonth(baseDate), "yyyy-MM-dd"),
            dateTo: format(endOfMonth(baseDate), "yyyy-MM-dd"),
          };
        default:
          return {
            dateFrom: format(baseDate, "yyyy-MM-dd"),
            dateTo: format(baseDate, "yyyy-MM-dd"),
          };
      }
    },
    []
  );

  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { dateFrom, dateTo } = calculateDateRange(selectedDate, period);

      // Call the Next.js API endpoint
      const response = await fetch("/api/standup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgName,
          date: dateFrom, // For now, use dateFrom as the primary date
          dateRange: period !== "daily" ? { dateFrom, dateTo } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch standup data");
      }

      const data = await response.json();
      const standupData: StandupResponse[] = data.summaries;

      // Transform standup data into performance data
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
          manHoursRationale: user.standup.manHoursRationale,
        };
      });

      // Sort by average man hours descending
      performanceMetrics.sort((a, b) => b.avgManHours - a.avgManHours);

      setPerformanceData(performanceMetrics);
    } catch (err) {
      console.error("Error fetching performance data:", err);
      setError("Failed to fetch performance data");
    } finally {
      setIsLoading(false);
    }
  }, [orgName, selectedDate, period, calculateDateRange]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const handlePeriodChange = (newPeriod: "daily" | "weekly" | "monthly") => {
    setPeriod(newPeriod);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("period", newPeriod);
    const { dateFrom, dateTo } = calculateDateRange(selectedDate, newPeriod);
    url.searchParams.set("dateFrom", dateFrom);
    url.searchParams.set("dateTo", dateTo);
    window.history.pushState({}, "", url.toString());
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    // Update URL
    const url = new URL(window.location.href);
    const { dateFrom, dateTo } = calculateDateRange(newDate, period);
    url.searchParams.set("dateFrom", dateFrom);
    url.searchParams.set("dateTo", dateTo);
    window.history.pushState({}, "", url.toString());
  };

  const { dateFrom, dateTo } = calculateDateRange(selectedDate, period);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Performance Review
          </h1>
          <p className="text-sm text-gray-600">
            {format(new Date(dateFrom), "MMM d")} -{" "}
            {format(new Date(dateTo), "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                disabled={isLoading}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={isLoading}
              className="text-xs sm:text-sm focus:outline-none min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-gray-500 text-xs sm:text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              readOnly
              className="text-xs sm:text-sm focus:outline-none text-gray-600 cursor-not-allowed min-w-0"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Performance Ranking
            </h2>
          </div>

          {isLoading ? (
            <div className="px-4 py-2">
              <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2 animate-pulse"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : performanceData.length > 0 ? (
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
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {user.totalManHoursMin}-{user.totalManHoursMax}h
                        </span>
                        <span>Avg: {user.avgManHours.toFixed(1)}h</span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          {user.totalActivities}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {user.activeDays}
                        </span>
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
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <p>No performance data available for this period.</p>
            </div>
          )}
        </div>

        {/* Detailed View Section - Hidden on mobile */}
        <div className="hidden lg:block bg-white rounded-lg border border-gray-200 p-6">
          {selectedUser ? (
            <div className="space-y-4">
              {/* User header */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <img
                  src={selectedUser.avatar_url}
                  alt={selectedUser.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedUser.name || selectedUser.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    @{selectedUser.username}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="font-semibold text-green-600">
                    {selectedUser.totalManHoursMin}-
                    {selectedUser.totalManHoursMax}h
                  </div>
                  <div className="text-sm text-gray-500">Man-Hours</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="font-semibold text-blue-600">
                    {selectedUser.avgManHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-500">Average</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="font-semibold text-purple-600">
                    {selectedUser.totalActivities}
                  </div>
                  <div className="text-sm text-gray-500">Activities</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="font-semibold text-orange-600">
                    {selectedUser.activeDays}
                  </div>
                  <div className="text-sm text-gray-500">Days</div>
                </div>
              </div>

              {/* Activity breakdown */}
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedUser.totalCommits} Commits
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedUser.totalPRs} PRs
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedUser.totalIssues} Issues
                </span>
              </div>

              {/* Man hours rationale */}
              {selectedUser.manHoursRationale && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Time Estimate Rationale
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedUser.manHoursRationale}
                  </p>
                </div>
              )}

              {/* Work done */}
              {selectedUser.workDone.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Work Completed
                  </h4>
                  <ul className="space-y-1">
                    {selectedUser.workDone.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="text-emerald-500 mt-0.5 font-medium">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 flex items-center justify-center h-full p-8">
              <p>
                Select a team member from the ranking to view detailed
                performance metrics.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Modal for Detailed View */}
      {selectedUser && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center"
          onClick={handleCloseModal}
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div
            className={`relative bg-white rounded-t-2xl w-full max-h-[90vh] flex flex-col ${
              isModalClosing ? "animate-slide-down" : "animate-slide-up"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={selectedUser.avatar_url}
                  alt={selectedUser.username}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {selectedUser.name || selectedUser.username}
                  </h3>
                  {selectedUser.name && (
                    <p className="text-sm text-gray-500 truncate">
                      @{selectedUser.username}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {selectedUser.totalManHoursMin}-
                    {selectedUser.totalManHoursMax}h
                  </div>
                  <div className="text-sm text-gray-500">Man-Hours</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {selectedUser.avgManHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-gray-500">Average</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {selectedUser.totalActivities}
                  </div>
                  <div className="text-sm text-gray-500">Activities</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {selectedUser.activeDays}
                  </div>
                  <div className="text-sm text-gray-500">Days</div>
                </div>
              </div>

              {/* Activity breakdown */}
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedUser.totalCommits} Commits
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedUser.totalPRs} PRs
                </span>
                <span className="flex items-center gap-1">
                  <svg
                    className="w-4 h-4 text-purple-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {selectedUser.totalIssues} Issues
                </span>
              </div>

              {/* Man hours rationale */}
              {selectedUser.manHoursRationale && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Time Estimate Rationale
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedUser.manHoursRationale}
                  </p>
                </div>
              )}

              {/* Work done */}
              {selectedUser.workDone.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Work Completed
                  </h4>
                  <ul className="space-y-2">
                    {selectedUser.workDone.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="text-emerald-500 mt-0.5 font-medium">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
