"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDatePicker } from "./calendar-date-picker";
import type {
  SimplifiedActivityDto,
  ActivitiesResponseDto,
} from "@/lib/matt-api";

interface ActivityFiltersProps {
  members: ActivitiesResponseDto["users"][string][];
  selectedUser?: string;
  selectedType?: string;
  selectedDateFrom?: string;
  selectedDateTo?: string;
  commitDates?: string[];
  allActivities?: SimplifiedActivityDto[];
}

export function ActivityFilters({
  members,
  selectedUser,
  selectedType,
  selectedDateFrom,
  commitDates = [],
  allActivities = [],
}: ActivityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleUserFilter = (user: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (user) {
      params.set("user", user);
    } else {
      params.delete("user");
    }
    router.push(`?${params.toString()}`);
  };

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type) {
      params.set("type", type);
    } else {
      params.delete("type");
    }
    router.push(`?${params.toString()}`);
  };

  const handleDateFilter = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      params.set("dateFrom", date);
    } else {
      params.delete("dateFrom");
    }
    router.push(`?${params.toString()}`);
  };

  const handleDateRangeFilter = (dateFrom: string, dateTo: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    } else {
      params.delete("dateFrom");
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    } else {
      params.delete("dateTo");
    }
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("user");
    params.delete("type");
    params.delete("dateFrom");
    params.delete("dateTo");
    router.push(`?${params.toString()}`);
  };

  // Calculate activity statistics
  const stats = {
    total: allActivities.length,
    commits: allActivities.filter((a) => a.type === "commit").length,
    issues: allActivities.filter((a) => a.type === "issue").length,
    pulls: allActivities.filter((a) => a.type === "pull").length,
  };

  return (
    <div className="space-y-6">
      {/* Activity Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Activity Overview
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-sm text-gray-500">Total Activities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.commits}
            </div>
            <div className="text-sm text-gray-500">Commits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stats.issues}
            </div>
            <div className="text-sm text-gray-500">Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pulls}
            </div>
            <div className="text-sm text-gray-500">Pull Requests</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {(selectedUser || selectedType || selectedDateFrom) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors hover:cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by User
            </label>
            <select
              value={selectedUser || ""}
              onChange={(e) => handleUserFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All users</option>
              {members.map((member) => (
                <option key={member.login} value={member.login}>
                  {member.name || member.login}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Type
            </label>
            <select
              value={selectedType || ""}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All types</option>
              <option value="commits">Commits</option>
              <option value="issues">Issues</option>
              <option value="pulls">Pull Requests</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Date Range
            </label>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="date"
                value={selectedDateFrom || ""}
                onChange={(e) =>
                  handleDateRangeFilter(
                    e.target.value,
                    searchParams.get("dateTo") || ""
                  )
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="From date"
              />
              <input
                type="date"
                value={searchParams.get("dateTo") || ""}
                onChange={(e) =>
                  handleDateRangeFilter(selectedDateFrom || "", e.target.value)
                }
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="To date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Date Filters */}
      {commitDates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Quick Jump to Date
          </h3>
          <CalendarDatePicker
            commitDates={commitDates}
            selectedDate={selectedDateFrom}
            onDateChange={handleDateFilter}
            label="Select Date"
          />
        </div>
      )}

      {/* Active Filters Summary */}
      {(selectedUser || selectedType || selectedDateFrom) && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Active Filters:
          </h3>
          <div className="space-y-1 text-sm text-blue-800">
            {selectedUser && (
              <div>
                User:{" "}
                {members.find((m) => m.login === selectedUser)?.name ||
                  selectedUser}
              </div>
            )}
            {selectedType && (
              <div>
                Type:{" "}
                {selectedType === "commits"
                  ? "Commits"
                  : selectedType === "issues"
                  ? "Issues"
                  : "Pull Requests"}
              </div>
            )}
            {selectedDateFrom && <div>From: {selectedDateFrom}</div>}
            {searchParams.get("dateTo") && (
              <div>To: {searchParams.get("dateTo")}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
