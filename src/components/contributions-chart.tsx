"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  eachDayOfInterval,
  isWithinInterval,
} from "date-fns";
import type { StandupResponse } from "@/lib/matt-api";
import { loadMockStandup } from "@/lib/mock/mockStandup";

interface ContributionsChartProps {
  orgName: string;
  initialPeriod?: "weekly" | "monthly";
  initialDateFrom?: string;
  initialDateTo?: string;
}

interface DailyContribution {
  date: Date;
  hours: number;
  activities: number;
}

interface ContributorData {
  username: string;
  name: string;
  avatar_url: string;
  totalManHours: number;
  avgManHours: number;
  totalActivities: number;
  dailyHours: DailyContribution[];
}

export function ContributionsChart({
  orgName,
  initialPeriod = "weekly",
  initialDateFrom,
}: ContributionsChartProps) {
  const [period, setPeriod] = useState<"weekly" | "monthly">(initialPeriod);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDateFrom ||
      format(
        startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      )
  );
  const [contributors, setContributors] = useState<ContributorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDateRange = useCallback(
    (date: string, periodType: "weekly" | "monthly") => {
      const baseDate = new Date(date);

      switch (periodType) {
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

  const fetchContributionsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { dateFrom, dateTo } = calculateDateRange(selectedDate, period);

      // Fetch data using the same endpoint as performance dashboard
      // const response = await fetch("/api/standup", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     orgName,
      //     date: dateFrom,
      //     dateRange: { dateFrom, dateTo },
      //   }),
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to fetch contribution data");
      // }

      // const data = await response.json();
      // const standupData: StandupResponse[] = data.summaries;

      const standupData: StandupResponse[] = loadMockStandup();

      console.log("Fetched standup data:", standupData);

      // Transform standup data into contributor data
      const contributorMap = new Map<string, ContributorData>();

      standupData.forEach((user) => {
        const avgManHours =
          (user.standup.totalManHoursMin + user.standup.totalManHoursMax) / 2;

        console.log(`Processing user ${user.username}:`, {
          totalManHoursMin: user.standup.totalManHoursMin,
          totalManHoursMax: user.standup.totalManHoursMax,
          avgManHours,
          hasDailyStandups:
            user.standup.dailyStandups && user.standup.dailyStandups.length > 0,
          dailyStandupsCount: user.standup.dailyStandups?.length || 0,
        });

        // Get all days in the period
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);
        const allDays = eachDayOfInterval({ start: startDate, end: endDate });

        // Create daily hours and activities map
        const dailyHoursMap = new Map<string, number>();
        const dailyActivitiesMap = new Map<string, number>();

        // If we have daily standups, populate the map
        if (
          user.standup.dailyStandups &&
          user.standup.dailyStandups.length > 0
        ) {
          user.standup.dailyStandups.forEach((daily) => {
            if (daily.date) {
              const dateStr = format(new Date(daily.date), "yyyy-MM-dd");
              const dailyAvg =
                (daily.totalManHoursMin + daily.totalManHoursMax) / 2;
              const dailyActivities =
                daily.totalCommits + daily.totalPRs + daily.totalIssues;
              dailyHoursMap.set(dateStr, dailyAvg);
              dailyActivitiesMap.set(dateStr, dailyActivities);
            }
          });
        } else {
          // If no daily standups, distribute the average hours evenly across the period
          // For weekly period, distribute across 7 days; for monthly across all days
          const hoursPerDay = avgManHours / allDays.length;
          const totalActivities =
            user.standup.totalCommits +
            user.standup.totalPRs +
            user.standup.totalIssues;
          const activitiesPerDay = totalActivities / allDays.length;
          allDays.forEach((day) => {
            dailyHoursMap.set(format(day, "yyyy-MM-dd"), hoursPerDay);
            dailyActivitiesMap.set(format(day, "yyyy-MM-dd"), activitiesPerDay);
          });
        }

        // Convert to daily hours array
        const dailyHours: DailyContribution[] = allDays.map((day) => ({
          date: day,
          hours: dailyHoursMap.get(format(day, "yyyy-MM-dd")) || 0,
          activities: dailyActivitiesMap.get(format(day, "yyyy-MM-dd")) || 0,
        }));

        console.log(
          `${user.username} daily hours:`,
          dailyHours.map((d) => ({
            date: format(d.date, "yyyy-MM-dd"),
            hours: d.hours,
          }))
        );

        contributorMap.set(user.username, {
          username: user.username,
          name: user.name,
          avatar_url: user.avatar_url,
          totalManHours:
            user.standup.totalManHoursMin + user.standup.totalManHoursMax,
          avgManHours,
          totalActivities:
            user.standup.totalCommits +
            user.standup.totalPRs +
            user.standup.totalIssues,
          dailyHours,
        });
      });

      // Convert to array and sort by average man hours
      const contributorsArray = Array.from(contributorMap.values());
      contributorsArray.sort((a, b) => b.avgManHours - a.avgManHours);

      setContributors(contributorsArray);
    } catch (err) {
      console.error("Error fetching contribution data:", err);
      setError("Failed to fetch contribution data");
    } finally {
      setIsLoading(false);
    }
  }, [orgName, selectedDate, period, calculateDateRange]);

  useEffect(() => {
    fetchContributionsData();
  }, [fetchContributionsData]);

  const handlePeriodChange = (newPeriod: "weekly" | "monthly") => {
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

  // Calculate max daily hours for scaling
  const maxDailyHours = Math.max(
    ...contributors.flatMap((c) => c.dailyHours.map((d) => d.hours)),
    1
  );

  // Calculate overall daily totals
  const allDays = eachDayOfInterval({
    start: new Date(dateFrom),
    end: new Date(dateTo),
  });

  const dailyTotals = allDays.map((day) => {
    const totals = contributors.reduce(
      (acc, contributor) => {
        const dayData = contributor.dailyHours.find(
          (d) => format(d.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
        );
        return {
          hours: acc.hours + (dayData?.hours || 0),
          activities: acc.activities + (dayData?.activities || 0),
        };
      },
      { hours: 0, activities: 0 }
    );
    return { date: day, hours: totals.hours, activities: totals.activities };
  });

  const maxTotalHours = Math.max(...dailyTotals.map((d) => d.hours), 1);

  return (
    <div className="flex flex-col h-full pb-6">
      {/* Header with controls */}
      <div className="flex-shrink-0 space-y-4 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
            <p className="text-sm text-gray-600">
              {format(new Date(dateFrom), "MMM d")} -{" "}
              {format(new Date(dateTo), "MMM d, yyyy")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Period selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["weekly", "monthly"] as const).map((p) => (
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

      {/* Main content */}
      <div className="flex-1 min-h-0 space-y-6 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-6">
            {/* Loading skeleton for overall chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
              <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
            {/* Loading skeleton for contributor cards */}
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : contributors.length > 0 ? (
          <>
            {/* Debug info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-yellow-800 mb-2">
                Debug Info:
              </h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <div>Contributors: {contributors.length}</div>
                <div>Max Daily Hours: {maxDailyHours.toFixed(1)}</div>
                <div>Max Total Hours: {maxTotalHours.toFixed(1)}</div>
                <div>
                  Date Range: {dateFrom} to {dateTo}
                </div>
                <div>
                  Daily Totals:{" "}
                  {dailyTotals.map((d) => d.hours.toFixed(1)).join(", ")}
                </div>
                <div>
                  First Contributor avgManHours:{" "}
                  {contributors[0]?.avgManHours.toFixed(1) || "N/A"}
                </div>
                <div>
                  First Contributor dailyHours:{" "}
                  {contributors[0]?.dailyHours
                    .map((d) => d.hours.toFixed(1))
                    .join(", ") || "N/A"}
                </div>
              </div>
            </div>

            {/* Overall contribution chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Man-hours over time
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Daily breakdown for {format(new Date(dateFrom), "MMM d")} -{" "}
                {format(new Date(dateTo), "MMM d, yyyy")}
              </p>

              {/* Aggregate daily chart */}
              <div className="relative pl-8">
                <div
                  className="flex items-end gap-1 border-l border-b border-gray-200 pl-2 pb-2"
                  style={{ height: "200px" }}
                >
                  {dailyTotals.map((dayTotal, index) => {
                    const height = Math.max(
                      (dayTotal.hours / maxTotalHours) * 180,
                      dayTotal.hours > 0 ? 4 : 0
                    );

                    return (
                      <div key={index} className="flex-1 relative group">
                        <div
                          className="w-full bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                          style={{ height: `${height}px` }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {format(dayTotal.date, "MMM d")}:<br />
                            {dayTotal.hours.toFixed(1)}h •{" "}
                            {Math.round(dayTotal.activities)} activities
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Y-axis labels and ticks */}
                <div className="absolute -left-5 top-0 bottom-10 flex items-center">
                  <span className="text-xs text-gray-500 -rotate-90">
                    Hours
                  </span>
                </div>
                {/* Y-axis hour markers */}
                {[
                  0,
                  Math.round(maxTotalHours * 0.25),
                  Math.round(maxTotalHours * 0.5),
                  Math.round(maxTotalHours * 0.75),
                  Math.round(maxTotalHours),
                ].map((hour, i) => (
                  <div
                    key={i}
                    className="absolute text-xs text-gray-400 text-right"
                    style={{
                      left: "0px",
                      bottom: `${50 + (hour / maxTotalHours) * 180}px`,
                      transform: "translateY(50%)",
                      width: "20px",
                    }}
                  >
                    {hour}
                  </div>
                ))}

                {/* X-axis labels */}
                <div className="flex justify-between mt-2 text-xs text-gray-500 pl-2">
                  {dailyTotals.map((day, i) => (
                    <span key={i} className="flex-1 text-center">
                      {format(day.date, "d")}
                    </span>
                  ))}
                </div>
                <div className="text-center text-xs text-gray-400 mt-1 pl-2">
                  {format(new Date(dateFrom), "MMMM yyyy")}
                </div>
              </div>
            </div>

            {/* Individual contributor cards - Grid layout on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {contributors.map((contributor, index) => (
                <div
                  key={contributor.username}
                  className="bg-white rounded-lg border border-gray-200 p-6"
                >
                  {/* Contributor header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={contributor.avatar_url}
                        alt={contributor.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {contributor.name || contributor.username}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{contributor.username} •{" "}
                          {contributor.avgManHours.toFixed(1)} man hours
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-500">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Daily bar chart */}
                  <div className="relative pl-6">
                    <div
                      className="flex items-end gap-0.5 border-l border-b border-gray-200 pl-2 pb-2"
                      style={{ height: "120px" }}
                    >
                      {contributor.dailyHours.map((day, dayIndex) => {
                        const height = Math.max(
                          (day.hours / maxDailyHours) * 100,
                          day.hours > 0 ? 4 : 0
                        );

                        return (
                          <div key={dayIndex} className="flex-1 relative group">
                            <div
                              className="w-full bg-indigo-500 hover:bg-indigo-600 transition-colors cursor-pointer"
                              style={{ height: `${height}px` }}
                            >
                              {day.hours > 0 && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {format(day.date, "MMM d")}:<br />
                                  {day.hours.toFixed(1)}h •{" "}
                                  {Math.round(day.activities)} activities
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Y-axis labels and ticks */}
                    <div className="absolute -left-5 top-0 bottom-2 flex items-center">
                      <span className="text-xs text-gray-500 -rotate-90">
                        Hours
                      </span>
                    </div>
                    {/* Y-axis hour markers */}
                    {[
                      0,
                      Math.round(maxDailyHours * 0.5),
                      Math.round(maxDailyHours),
                    ].map((hour, i) => (
                      <div
                        key={i}
                        className="absolute text-xs text-gray-400 text-right"
                        style={{
                          left: "0px",
                          bottom: `${30 + (hour / maxDailyHours) * 100}px`,
                          transform: "translateY(50%)",
                          width: "16px",
                        }}
                      >
                        {hour}
                      </div>
                    ))}

                    {/* X-axis labels - show fewer labels for readability */}
                    <div className="flex justify-between mt-2 text-xs text-gray-400 pl-2">
                      {contributor.dailyHours
                        .filter(
                          (_, i) =>
                            i === 0 ||
                            i === contributor.dailyHours.length - 1 ||
                            i === Math.floor(contributor.dailyHours.length / 2)
                        )
                        .map((day, i) => (
                          <span
                            key={i}
                            className={
                              i === 1
                                ? "absolute left-1/2 transform -translate-x-1/2"
                                : ""
                            }
                          >
                            {format(day.date, "MMM d")}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
            No contribution data available for this period.
          </div>
        )}
      </div>
    </div>
  );
}
