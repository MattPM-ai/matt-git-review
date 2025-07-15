"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
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
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(initialPeriod);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDateFrom || format(new Date(), "yyyy-MM-dd")
  );
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PerformanceData | null>(null);

  const calculateDateRange = useCallback((date: string, periodType: "daily" | "weekly" | "monthly") => {
    const baseDate = new Date(date);
    
    switch (periodType) {
      case "daily":
        return {
          dateFrom: format(baseDate, "yyyy-MM-dd"),
          dateTo: format(baseDate, "yyyy-MM-dd"),
        };
      case "weekly":
        return {
          dateFrom: format(startOfWeek(baseDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          dateTo: format(endOfWeek(baseDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
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
  }, []);

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
      const performanceMetrics: PerformanceData[] = standupData.map(user => {
        const avgManHours = (user.standup.totalManHoursMin + user.standup.totalManHoursMax) / 2;
        
        // Calculate active days based on period
        let activeDays = 1;
        if (period === "weekly") {
          activeDays = Math.min(user.standup.totalCommits > 0 ? 5 : 0, 7); // Assume workdays
        } else if (period === "monthly") {
          activeDays = Math.min(user.standup.totalCommits > 0 ? 20 : 0, 30); // Assume workdays
        }

        return {
          username: user.username,
          name: user.name,
          avatar_url: user.avatar_url,
          totalCommits: user.standup.totalCommits,
          totalPRs: user.standup.totalPRs,
          totalIssues: user.standup.totalIssues,
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
          <h1 className="text-2xl font-bold text-gray-900">Performance Review</h1>
          <p className="text-sm text-gray-600">
            {format(new Date(dateFrom), "MMM d")} - {format(new Date(dateTo), "MMM d, yyyy")}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["daily", "weekly", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  period === p
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Date picker */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          {/* Refresh button */}
          <button
            onClick={fetchPerformanceData}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Ranking</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : performanceData.length > 0 ? (
            <div className="space-y-2">
              {performanceData.map((user, index) => (
                <div
                  key={user.username}
                  onClick={() => setSelectedUser(user)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.username === user.username
                      ? "bg-indigo-50 border border-indigo-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
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
                      <span className="text-xs text-gray-500">@{user.username}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>{user.totalManHoursMin}-{user.totalManHoursMax}h</span>
                      <span>Avg: {user.avgManHours.toFixed(1)}h</span>
                      <span>{user.totalCommits} commits</span>
                      <span>{user.activeDays} active days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No performance data available for this period.</p>
            </div>
          )}
        </div>

        {/* Detailed View Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed View</h2>
          
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
                  <p className="text-sm text-gray-500">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {selectedUser.totalManHoursMin}-{selectedUser.totalManHoursMax}h
                  </div>
                  <div className="text-xs text-gray-500">Man Hours Range</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {selectedUser.avgManHours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-gray-500">Average Hours</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">
                    {selectedUser.totalCommits}
                  </div>
                  <div className="text-xs text-gray-500">Total Commits</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {selectedUser.activeDays}
                  </div>
                  <div className="text-xs text-gray-500">Active Days</div>
                </div>
              </div>

              {/* Man hours rationale */}
              {selectedUser.manHoursRationale && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Time Estimate Rationale</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedUser.manHoursRationale}
                  </p>
                </div>
              )}

              {/* Work done */}
              {selectedUser.workDone.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Work Completed</h4>
                  <ul className="space-y-2">
                    {selectedUser.workDone.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-emerald-500 mt-0.5 font-medium">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Select a team member from the ranking to view detailed performance metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}