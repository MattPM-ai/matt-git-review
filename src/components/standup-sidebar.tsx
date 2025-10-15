"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  subDays,
} from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import type { ActivitiesResponseDto } from "@/lib/matt-api";

// Define local types to replace the old GitHub API types
type GitHubUser = ActivitiesResponseDto["users"][string];
type CommitAuthor = {
  login: string;
  name?: string;
};

interface StandupSidebarProps {
  members: GitHubUser[];
  commitDates: string[];
  selectedDate?: string;
  orgName: string;
  dailyCommitAuthors?: Record<string, CommitAuthor[]>;
}

export function StandupSidebar({
  members,
  commitDates = [],
  selectedDate,
  dailyCommitAuthors = {},
}: StandupSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Client-side date selection for instant response
  const [clientSelectedDate, setClientSelectedDate] = useState<string>(
    selectedDate || format(subDays(new Date(), 1), "yyyy-MM-dd")
  );

  const selectedDateObj = new Date(clientSelectedDate);

  // Sync with URL when component mounts
  useEffect(() => {
    if (selectedDate) {
      setClientSelectedDate(selectedDate);
    }
  }, [selectedDate]);

  const handleDateSelect = (date: string) => {
    // Instantly update client state for immediate UI response
    setClientSelectedDate(date);

    // Update URL in background (non-blocking)
    const params = new URLSearchParams(searchParams.toString());
    params.set("dateFrom", date);
    params.set("dateTo", date);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startingDayOfWeek = getDay(monthStart);
  const leadingEmptyDays = Array(startingDayOfWeek).fill(null);

  const commitDatesSet = new Set(commitDates);

  const todaysAuthors = dailyCommitAuthors[clientSelectedDate] || [];
  const uniqueAuthors = Array.from(
    new Map(todaysAuthors.map((author) => [author.login, author])).values()
  );
  const completedCount = uniqueAuthors.length;
  const totalCount = members.length;

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(selectedDateObj, "EEEE, MMMM d, yyyy")}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Select a date to view standup
        </p>
      </div>

      {/* Calendar Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hover:cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hover:cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {leadingEmptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="h-8" />
          ))}
          {monthDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const hasCommits = commitDatesSet.has(dateStr);
            const isSelected = format(day, "yyyy-MM-dd") === clientSelectedDate;
            const isToday =
              format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <button
                key={dateStr}
                onClick={() => handleDateSelect(dateStr)}
                className={`
                  h-8 rounded-lg flex items-center justify-center text-sm font-medium
                  transition-colors relative
                  ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : isToday
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                      : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                {format(day, "d")}
                {hasCommits && !isSelected && (
                  <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Days with commits</span>
          </div>
        </div>
      </div>

      {/* Team Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Team Status
        </h3>
        <div className="space-y-3">
          {members.map((member) => {
            const hasCommitted = uniqueAuthors.some(
              (author) => author.login === member.login
            );
            return (
              <div key={member.id} className="flex items-center gap-3">
                <div className="relative">
                  <Image
                    src={member.avatar_url}
                    alt={member.login}
                    width={32}
                    height={32}
                    className="rounded-full"
                    unoptimized
                  />
                  {hasCommitted && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {member.login}
                  </p>
                  <p className="text-xs text-gray-500">Developer</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Completed:{" "}
            <span className="font-bold text-gray-900">
              {completedCount}/{totalCount}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
