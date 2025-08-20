"use client";

import { DailyTimeline } from "./daily-timeline";

interface DailyStandup {
  date: string;
  summary: string;
  workDone: string[];
  workingOn: string[];
  concerns: string;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
  manHoursRationale: string;
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
  concerns: string;
  manHoursRationale: string;
  dailyStandups?: DailyStandup[];
}

interface UserDetailsContentProps {
  selectedUser: PerformanceData;
  variant?: "desktop" | "mobile";
}

export function UserDetailsContent({
  selectedUser,
  variant = "desktop",
}: UserDetailsContentProps) {
  const isDesktop = variant === "desktop";

  return (
    <div className={`space-y-4 ${isDesktop ? "" : ""}`}>
      {/* Metrics */}
      <div
        className={`grid gap-3 ${
          isDesktop ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2"
        }`}
      >
        <div
          className={`bg-gray-50 rounded-lg text-center ${
            isDesktop ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`font-semibold text-green-600 ${
              isDesktop ? "" : "text-lg"
            }`}
          >
            {selectedUser.totalManHoursMin} - {selectedUser.totalManHoursMax}h
          </div>
          <div className="text-sm text-gray-500">Man-Hours</div>
        </div>
        <div
          className={`bg-gray-50 rounded-lg text-center ${
            isDesktop ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`font-semibold text-blue-600 ${
              isDesktop ? "" : "text-lg"
            }`}
          >
            {selectedUser.avgManHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-500">Average</div>
        </div>
        <div
          className={`bg-gray-50 rounded-lg text-center ${
            isDesktop ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`font-semibold text-purple-600 ${
              isDesktop ? "" : "text-lg"
            }`}
          >
            {selectedUser.totalActivities}
          </div>
          <div className="text-sm text-gray-500">Activities</div>
        </div>
        <div
          className={`bg-gray-50 rounded-lg text-center ${
            isDesktop ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`font-semibold text-orange-600 ${
              isDesktop ? "" : "text-lg"
            }`}
          >
            {selectedUser.activeDays}
          </div>
          <div className="text-sm text-gray-500">
            {isDesktop ? "Days" : "Active Days"}
          </div>
        </div>
      </div>

      {/* Activity breakdown */}
      <div
        className={`flex items-center justify-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg ${
          isDesktop ? "p-2" : "p-3"
        }`}
      >
        <span className="flex items-center gap-1">
          <svg
            className={`text-green-600 ${
              isDesktop ? "w-3.5 h-3.5" : "w-4 h-4"
            }`}
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
            className={`text-blue-600 ${isDesktop ? "w-3.5 h-3.5" : "w-4 h-4"}`}
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
            className={`text-purple-600 ${
              isDesktop ? "w-3.5 h-3.5" : "w-4 h-4"
            }`}
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

      {selectedUser.concerns && selectedUser.concerns.trim() && (
        <div className="flex items-start gap-2">
          <div className="pt-0.5">
            <svg
              className="w-4 h-4 text-red-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 2a8 8 0 100 16 8 8 0 000-16zm.75 5.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zm-.75 8a1 1 0 110-2 1 1 0 010 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="text-red-700 text-sm font-bold">
            {selectedUser.concerns}
          </span>
        </div>
      )}

      {/* Man hours rationale */}
      {selectedUser.manHoursRationale && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Time Estimate Rationale
          </h4>
          <p
            className={`text-sm text-gray-600 bg-gray-50 rounded-lg ${
              isDesktop ? "p-3" : "p-3"
            }`}
          >
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
          <ul className={`${isDesktop ? "space-y-1" : "space-y-2"}`}>
            {selectedUser.workDone.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-emerald-500 mt-0.5 font-medium">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Working on */}
      {selectedUser.workingOn.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Currently Working On
          </h4>
          <ul className={`${isDesktop ? "space-y-1" : "space-y-2"}`}>
            {selectedUser.workingOn.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-blue-500 mt-0.5 font-medium">⚡</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Daily Timeline */}
      {selectedUser.dailyStandups && selectedUser.dailyStandups.length > 0 && (
        <DailyTimeline
          dailyStandups={selectedUser.dailyStandups}
          variant={variant}
        />
      )}
    </div>
  );
}
