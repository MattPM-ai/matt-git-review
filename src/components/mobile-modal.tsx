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
  ongoingIssues: string[];
  manHoursRationale: string;
  dailyStandups?: Array<{
    date?: Date;
    summary: string;
    workDone: string[];
    workingOn: string[];
    ongoingIssues: string[];
    totalCommits: number;
    totalPRs: number;
    totalIssues: number;
    totalManHoursMin: number;
    totalManHoursMax: number;
    manHoursRationale: string;
  }>;
}

interface MobileModalProps {
  selectedUser: PerformanceData | null;
  isModalClosing: boolean;
  onClose: () => void;
}

export function MobileModal({ selectedUser, isModalClosing, onClose }: MobileModalProps) {
  if (!selectedUser) {
    return null;
  }

  return (
    <div
      className="lg:hidden fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div
        className={`relative bg-white rounded-t-2xl w-full max-h-[90vh] flex flex-col ${
          isModalClosing ? "animate-slide-down" : "animate-slide-up"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={selectedUser.avatar_url}
              alt={selectedUser.username}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {selectedUser.name || selectedUser.username}
              </h3>
              {selectedUser.name && (
                <p className="text-sm text-gray-500 truncate">
                  @{selectedUser.username}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <UserDetailsContent selectedUser={selectedUser} variant="mobile" />
        </div>
      </div>
    </div>
  );
}