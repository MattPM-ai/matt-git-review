"use client";

import { Terminal, GitPullRequest, AlertCircle } from "lucide-react";
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
          <Terminal
            className={`text-green-600 ${
              isDesktop ? "w-3.5 h-3.5" : "w-4 h-4"
            }`}
          />
          {selectedUser.totalCommits} Commits
        </span>
        <span className="flex items-center gap-1">
          <GitPullRequest
            className={`text-blue-600 ${isDesktop ? "w-3.5 h-3.5" : "w-4 h-4"}`}
          />
          {selectedUser.totalPRs} PRs
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle
            className={`text-purple-600 ${
              isDesktop ? "w-3.5 h-3.5" : "w-4 h-4"
            }`}
          />
          {selectedUser.totalIssues} Issues
        </span>
      </div>

      {selectedUser.concerns && selectedUser.concerns.trim() && (
        <div className="flex items-start gap-2">
          <div className="pt-0.5">
            <AlertCircle
              className="w-4 h-4 text-red-600 flex-shrink-0"
              aria-hidden="true"
            />
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
