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
import { UserDetailedView } from "./user-detailed-view";
import { MobileModal } from "./mobile-modal";

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
          workingOn: user.standup.workingOn,
          ongoingIssues: user.standup.ongoingIssues,
          manHoursRationale: user.standup.manHoursRationale,
          dailyStandups: user.standup.dailyStandups,
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
    <div className="flex flex-col h-full pb-6">
      {/* Header with controls */}
      <div className="flex-shrink-0 space-y-4 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Performance & Standup
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
      </div>

      {/* Main content - flex-1 to fill remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden lg:col-span-1 flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Performance Ranking
            </h2>
          </div>

          {isLoading ? (
            <div className="flex-1 px-4 py-2">
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

                        {/* Progress bar for manhours */}
                        <div className="mb-1">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span className="font-medium">
                              {user.totalManHoursMin}-{user.totalManHoursMax}h
                            </span>
                            <span>Avg: {user.avgManHours.toFixed(1)}h</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
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
