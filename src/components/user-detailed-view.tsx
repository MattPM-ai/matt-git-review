"use client";

import { UserDetailsContent } from "./user-details-content";

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
  dailyStandups?: Array<{
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
  }>;
}

interface UserDetailedViewProps {
  selectedUser: PerformanceData | null;
}

export function UserDetailedView({ selectedUser }: UserDetailedViewProps) {
  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-500">
        <p className="max-w-sm">
          Select a team member from the ranking to view detailed
          performance metrics and standups.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* User header - fixed */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={selectedUser.avatar_url}
            alt={selectedUser.username}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-900">
              {selectedUser.name || selectedUser.username}
            </h3>
            <p className="text-sm text-gray-500">
              @{selectedUser.username}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <UserDetailsContent selectedUser={selectedUser} variant="desktop" />
      </div>
    </>
  );
}