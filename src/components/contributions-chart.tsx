"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Clock } from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  eachDayOfInterval,
} from "date-fns";
import { DateRangePicker, type PeriodType } from "./date-range-picker";
import { TaskLoadingState } from "./task-loading-state";
import { useStandupData } from "@/hooks/useStandupData";

interface ContributionsChartProps {
  orgName: string;
  initialPeriod?: PeriodType;
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
  initialDateTo,
}: ContributionsChartProps) {
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
  const [contributors, setContributors] = useState<ContributorData[]>([]);
  const dataFetchedRef = useRef(false);
  
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
    useMockWhenUnauthenticated: true,
  });

  const handlePeriodChange = useCallback((newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    periodRef.current = newPeriod; // Update ref immediately
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("period", newPeriod);
    url.searchParams.set("dateFrom", dateRange.dateFrom);
    url.searchParams.set("dateTo", dateRange.dateTo);
    window.history.pushState({}, "", url.toString());
  }, [dateRange, setPeriod]);

  const handleDateRangeChange = useCallback((newDateRange: { dateFrom: string; dateTo: string }) => {
    setDateRange(newDateRange);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set("period", periodRef.current); // Use ref for latest value
    url.searchParams.set("dateFrom", newDateRange.dateFrom);
    url.searchParams.set("dateTo", newDateRange.dateTo);
    window.history.pushState({}, "", url.toString());
    
    // Trigger fetch with new date range
    fetchStandupData({
      dateFrom: newDateRange.dateFrom,
      dateTo: newDateRange.dateTo,
    });
  }, [fetchStandupData]);

  // Transform standup data into contributor data whenever standupData changes
  useEffect(() => {
    if (standupData.length > 0) {
      // Transform standup data into contributor data
      const contributorMap = new Map<string, ContributorData>();

      standupData.forEach((user) => {
        const avgManHours =
          (user.standup.totalManHoursMin + user.standup.totalManHoursMax) / 2;

        // Get all days in the period
        const startDate = new Date(dateRange.dateFrom);
        const endDate = new Date(dateRange.dateTo);
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
    } else {
      setContributors([]);
    }
  }, [standupData, dateRange.dateFrom, dateRange.dateTo]);

  // Only fetch data on initial load when orgName is available
  useEffect(() => {
    if (orgName && !dataFetchedRef.current) {
      dataFetchedRef.current = true;
      fetchStandupData();
    }
  }, [orgName, fetchStandupData]);


  // Calculate max daily hours for scaling
  const maxDailyHours = Math.max(
    ...contributors.flatMap((c) => c.dailyHours.map((d) => d.hours)),
    1
  );

  // Calculate overall daily totals
  const allDays = eachDayOfInterval({
    start: new Date(dateRange.dateFrom),
    end: new Date(dateRange.dateTo),
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

      {/* Main content */}
      <div className="flex-1 min-h-0 space-y-6 overflow-y-auto">
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Contributions Loading
              </h2>
            </div>
            <TaskLoadingState task={currentTask} />
          </div>
        ) : noActivity ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="mb-4">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">No Activity Found</p>
            <p className="text-sm text-gray-500">
              There was no development activity during this period.<br />
              Try selecting a different date range.
            </p>
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
                  Date Range: {dateRange.dateFrom} to {dateRange.dateTo}
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
                Daily breakdown for {format(new Date(dateRange.dateFrom), "MMM d")} -{" "}
                {format(new Date(dateRange.dateTo), "MMM d, yyyy")}
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
                  {format(new Date(dateRange.dateFrom), "MMMM yyyy")}
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
                      <Image
                        src={contributor.avatar_url}
                        alt={contributor.username}
                        width={48}
                        height={48}
                        className="rounded-full"
                        unoptimized
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
