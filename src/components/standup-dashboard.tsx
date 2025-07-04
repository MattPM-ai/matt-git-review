"use client";

import { useState, useEffect } from "react";
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
import type { GitHubUser, CommitAuthor } from "@/lib/github-api";
import type { StandupSummary } from "@/lib/openai";

interface StandupDashboardProps {
  members: GitHubUser[];
  commitDates: string[];
  selectedDate?: string;
  orgName: string;
  dailyCommitAuthors?: Record<string, CommitAuthor[]>;
}

export function StandupDashboard({
  members,
  commitDates = [],
  selectedDate,
  orgName,
  dailyCommitAuthors = {},
}: StandupDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [standupSummaries, setStandupSummaries] = useState<StandupSummary[]>(
    []
  );
  const [isGeneratingStandups, setIsGeneratingStandups] = useState(false);
  const [standupError, setStandupError] = useState<string | null>(null);

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

  // Generate summaries when client date or members change
  useEffect(() => {
    if (clientSelectedDate && members.length > 0) {
      generateStandupSummaries();
    }
  }, [clientSelectedDate, members]);

  const generateStandupSummaries = async () => {
    if (!clientSelectedDate || isGeneratingStandups) return;

    setIsGeneratingStandups(true);
    setStandupError(null);

    try {
      const response = await fetch("/api/standup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgName,
          date: clientSelectedDate,
          users: members,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate standup summaries");
      }

      const data = await response.json();
      setStandupSummaries(data.summaries);
    } catch (error) {
      console.error("Error generating standup summaries:", error);
      setStandupError("Failed to generate AI summaries");
    } finally {
      setIsGeneratingStandups(false);
    }
  };

  const handleDateSelect = (date: string) => {
    // Instantly update client state for immediate UI response
    setClientSelectedDate(date);
    setStandupSummaries([]);
    setStandupError(null);

    // Update URL in background (non-blocking)
    const params = new URLSearchParams(searchParams.toString());
    params.set("dateFrom", date);
    params.set("dateTo", date);
    router.replace(`?${params.toString()}`, { scroll: false });
  };


  const todaysAuthors = dailyCommitAuthors[clientSelectedDate] || [];
  const uniqueAuthors = Array.from(
    new Map(todaysAuthors.map((author) => [author.login, author])).values()
  );
  const completedCount = uniqueAuthors.length;
  const totalCount = members.length;

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Standup Summaries</h2>
        <button
          onClick={generateStandupSummaries}
          disabled={isGeneratingStandups}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
        >
          {isGeneratingStandups ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh AI Summaries
            </>
          )}
        </button>
      </div>

      {standupError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{standupError}</p>
        </div>
      )}

      <div className="space-y-4">
        {isGeneratingStandups ? (
          // Show skeleton cards while loading
          <>
            {uniqueAuthors.slice(0, 3).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </>
        ) : standupSummaries.length > 0 ? (
          standupSummaries.map((summary) => {
            const member = members.find(
              (m) => m.login === summary.userLogin
            );
            return (
              <div
                key={summary.userLogin}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={
                      member?.avatar_url ||
                      `https://github.com/${summary.userLogin}.png`
                    }
                    alt={summary.userLogin}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {summary.userLogin}
                      </h4>
                      <svg
                        className="w-4 h-4 text-indigo-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V8z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-700">
                          {summary.summary}
                        </p>
                      </div>

                      {summary.workDone.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Work Completed:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1.5">
                            {summary.workDone.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-emerald-500 mt-0.5 font-medium">
                                  ✓
                                </span>
                                <span className="leading-relaxed">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {summary.nextSteps.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Next Steps:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1.5">
                            {summary.nextSteps.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-indigo-500 mt-0.5 font-medium">
                                  →
                                </span>
                                <span className="leading-relaxed">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {summary.blockers.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Blockers:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1.5">
                            {summary.blockers.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-amber-500 mt-0.5 font-medium">
                                  ⚠
                                </span>
                                <span className="leading-relaxed">
                                  {item}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : uniqueAuthors.length > 0 ? (
          <div className="text-center py-12 text-gray-500">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              No AI summaries generated yet
            </p>
            <p className="text-sm">
              Click "Refresh AI Summaries" to generate standup summaries
              for team members who committed today.
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
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
              No activity for this date
            </p>
            <p className="text-sm">
              No commits were found for{" "}
              {format(selectedDateObj, "MMMM d, yyyy")}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
