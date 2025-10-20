"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Loader2, RefreshCw, Mail, Clock, FileText, LayoutGrid } from "lucide-react";
import { format, subDays } from "date-fns";
import type { ActivitiesResponseDto } from "@/lib/api";
import { TaskLoadingState } from "./task-loading-state";
import { useStandupData } from "@/hooks/useStandupData";

// Define local types to replace the old GitHub API types
type GitHubUser = ActivitiesResponseDto["users"][string];
type CommitAuthor = {
  login: string;
  name?: string;
};

interface StandupDashboardProps {
  members: GitHubUser[];
  commitDates: string[];
  selectedDate?: string;
  orgName: string;
  dailyCommitAuthors?: Record<string, CommitAuthor[]>;
}

export function StandupDashboard({
  members,
  selectedDate,
  orgName,
  dailyCommitAuthors = {},
}: StandupDashboardProps) {
  const [isGeneratingCommitReport, setIsGeneratingCommitReport] =
    useState(false);
  const [commitReportError, setCommitReportError] = useState<string | null>(
    null
  );
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // Client-side date selection for instant response
  const [clientSelectedDate, setClientSelectedDate] = useState<string>(
    selectedDate || format(subDays(new Date(), 1), "yyyy-MM-dd")
  );

  const selectedDateObj = new Date(clientSelectedDate);

  const {
    standupData: standupSummaries,
    isLoading: isGeneratingStandups,
    error: standupError,
    noActivity,
    currentTask,
    fetchStandupData,
  } = useStandupData({
    organizationLogin: orgName,
    dateFrom: clientSelectedDate,
    dateTo: clientSelectedDate,
  });

  const generateStandupSummaries = useCallback(() => {
    if (!clientSelectedDate) return;
    fetchStandupData({
      dateFrom: clientSelectedDate,
      dateTo: clientSelectedDate,
    });
  }, [clientSelectedDate, fetchStandupData]);

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
  }, [clientSelectedDate, members.length, generateStandupSummaries]);

  const generateCommitReport = async (email?: string) => {
    if (isGeneratingCommitReport) return;

    setIsGeneratingCommitReport(true);
    setCommitReportError(null);

    try {
      const today = new Date();
      const formattedDate = format(today, "yyyy-MM-dd");

      const response = await fetch("/api/commit-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgName,
          date: formattedDate,
          users: members,
          email: email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate commit report");
      }
    } catch (error) {
      console.error("Error generating commit report:", error);
      setCommitReportError("Failed to generate commit report");
    } finally {
      setIsGeneratingCommitReport(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = () => {
    setEmailError(null);

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(
        "Please enter a valid email address (e.g., email@example.com)"
      );
      return;
    }

    generateCommitReport(email);
    setIsEmailModalOpen(false);
    setEmail("");
  };

  const todaysAuthors = dailyCommitAuthors[clientSelectedDate] || [];
  const uniqueAuthors = Array.from(
    new Map(todaysAuthors.map((author) => [author.login, author])).values()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Standup Summaries</h2>
        <button
          onClick={generateStandupSummaries}
          disabled={isGeneratingStandups}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium hover:cursor-pointer"
        >
          {isGeneratingStandups ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh AI Summaries
            </>
          )}
        </button>
        <button
          onClick={() => setIsEmailModalOpen(true)}
          disabled={isGeneratingCommitReport}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium hover:cursor-pointer"
        >
          {isGeneratingCommitReport ? (
            <>
              <Loader2 className="animate-spin h-4 w-4" />
              Generating report...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Send Commit Report
            </>
          )}
        </button>
      </div>

      {standupError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{standupError}</p>
        </div>
      )}

      {commitReportError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{commitReportError}</p>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                placeholder="email@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleEmailSubmit();
                  }
                }}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEmailSubmit}
                disabled={isGeneratingCommitReport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium hover:cursor-pointer"
              >
                {isGeneratingCommitReport ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Report
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsEmailModalOpen(false);
                  setEmail("");
                  setEmailError(null);
                }}
                disabled={isGeneratingCommitReport}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium hover:cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isGeneratingStandups ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Generating Standup Summaries
              </h3>
            </div>
            <TaskLoadingState task={currentTask} />
          </div>
        ) : noActivity ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              No Activity for {format(selectedDateObj, "MMMM d, yyyy")}
            </p>
            <p className="text-sm text-gray-500">
              There was no development activity on this date.
              <br />
              Try selecting a different date from the calendar.
            </p>
          </div>
        ) : standupSummaries.length > 0 ? (
          // Show actual standup summaries
          <>
            {standupSummaries.map((summary) => (
              <div
                key={summary.username}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <Image
                    src={summary.avatar_url}
                    alt={summary.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                    unoptimized
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {summary.name}
                    </h3>
                    <p className="text-gray-600">@{summary.username}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-700">{summary.standup.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Work Done
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {summary.standup.workDone.map((work, index) => (
                        <li key={index}>{work}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Working On
                    </h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {summary.standup.workingOn.map((work, index) => (
                        <li key={index}>{work}</li>
                      ))}
                    </ul>
                  </div>
                  {summary.standup.concerns && summary.standup.concerns.trim() && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Concerns
                      </h4>
                      <p className="text-gray-700">{summary.standup.concerns}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Commits:</span>{" "}
                      {summary.standup.totalCommits}
                    </div>
                    <div>
                      <span className="font-medium">PRs:</span>{" "}
                      {summary.standup.totalPRs}
                    </div>
                    <div>
                      <span className="font-medium">Issues:</span>{" "}
                      {summary.standup.totalIssues}
                    </div>
                    <div>
                      <span className="font-medium">Hours:</span>{" "}
                      {summary.standup.totalManHoursMin}-
                      {summary.standup.totalManHoursMax}h
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Hours Rationale
                    </h4>
                    <p className="text-gray-700 text-sm">
                      {summary.standup.manHoursRationale}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : standupSummaries.length > 0 ? (
          standupSummaries.map((summary) => {
            return (
              <div
                key={summary.username}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <Image
                    src={summary.avatar_url}
                    alt={summary.username}
                    width={48}
                    height={48}
                    className="rounded-full border-2 border-white shadow-sm"
                    unoptimized
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {summary.name || summary.username}
                      </h4>
                      <span className="text-sm text-gray-500">
                        @{summary.username}
                      </span>
                      <LayoutGrid className="w-4 h-4 text-indigo-500" />
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-700">
                          {summary.standup.summary}
                        </p>
                      </div>

                      {/* Activity metrics */}
                      <div className="flex flex-wrap gap-4 p-3 bg-white rounded-md border border-gray-100">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-green-600">
                            {summary.standup.totalCommits}
                          </div>
                          <div className="text-xs text-gray-500">Commits</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-600">
                            {summary.standup.totalPRs}
                          </div>
                          <div className="text-xs text-gray-500">PRs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-purple-600">
                            {summary.standup.totalIssues}
                          </div>
                          <div className="text-xs text-gray-500">Issues</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-600">
                            {summary.standup.totalManHoursMin}-
                            {summary.standup.totalManHoursMax}h
                          </div>
                          <div className="text-xs text-gray-500">
                            Est. Hours
                          </div>
                        </div>
                      </div>

                      {summary.standup.workDone.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Work Completed:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1.5">
                            {summary.standup.workDone.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-emerald-500 mt-0.5 font-medium">
                                  ✓
                                </span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {summary.standup.workingOn.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Currently Working On:
                          </p>
                          <ul className="text-sm text-gray-700 space-y-1.5">
                            {summary.standup.workingOn.map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-indigo-500 mt-0.5 font-medium">
                                  →
                                </span>
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {summary.standup.concerns && summary.standup.concerns.trim() && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Concerns:
                          </p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {summary.standup.concerns}
                          </p>
                        </div>
                      )}

                      {summary.standup.manHoursRationale && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          <strong>Time Estimate Rationale:</strong>{" "}
                          {summary.standup.manHoursRationale}
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
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              No AI summaries generated yet
            </p>
            <p className="text-sm">
              Click &quot;Refresh AI Summaries&quot; to generate standup
              summaries for team members who committed today.
            </p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="mb-4">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
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
