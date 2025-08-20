"use client";

import { format } from "date-fns";

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

interface DailyTimelineProps {
  dailyStandups: DailyStandup[];
  variant?: "desktop" | "mobile";
}

export function DailyTimeline({
  dailyStandups,
  variant = "desktop",
}: DailyTimelineProps) {
  if (!dailyStandups || dailyStandups.length === 0) {
    return null;
  }

  const isDesktop = variant === "desktop";

  return (
    <div>
      <h4
        className={`font-semibold text-gray-700 mb-3 ${
          isDesktop ? "text-sm" : "text-sm"
        }`}
      >
        Daily Standup
      </h4>
      <div className="">
        {dailyStandups.map((daily, index) => (
          <div
            key={index}
            className="border-l-2 border-gray-200 pl-4 pb-6 last:pb-0"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full -ml-5 border-2 border-white"></div>
              <h5
                className={`font-medium text-gray-900 ${
                  isDesktop ? "text-xs" : "text-sm"
                }`}
              >
                {daily.date
                  ? format(new Date(daily.date), "MMM d, yyyy")
                  : `Day ${index + 1}`}
              </h5>
              {isDesktop && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{daily.totalCommits} commits</span>
                  <span className="text-green-600">
                    {daily.totalManHoursMin} - {daily.totalManHoursMax}{" "}
                    man-hours
                  </span>
                </div>
              )}
            </div>

            {!isDesktop && (
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <span>{daily.totalCommits} commits</span>
                <span className="text-green-600">
                  {daily.totalManHoursMin} - {daily.totalManHoursMax} man-hours
                </span>
              </div>
            )}

            {daily.workDone.length > 0 && (
              <ul className={`space-y-1`}>
                {daily.workDone.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className={`flex items-start gap-${
                      isDesktop ? "1" : "2"
                    } text-gray-600 ${isDesktop ? "text-xs" : "text-sm"}`}
                  >
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
