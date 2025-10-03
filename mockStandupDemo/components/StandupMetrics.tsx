/**
 * COMPONENT: StandupMetrics
 * 
 * PURPOSE: Display activity metrics in a visually organized grid format
 * 
 * FUNCTIONALITY:
 * - Renders four key metrics: commits, PRs, issues, and estimated hours
 * - Uses color-coded scheme for easy visual identification
 * - Responsive layout (2x2 on mobile, 4x1 on desktop)
 */

import React from 'react';

interface StandupMetricsProps {
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
}

export function StandupMetrics({
  totalCommits,
  totalPRs,
  totalIssues,
  totalManHoursMin,
  totalManHoursMax,
}: StandupMetricsProps) {
  return (
    <div className="flex flex-wrap gap-4 p-3 bg-white rounded-md border border-gray-100">
      {/* Commits Metric */}
      <div className="text-center">
        <div className="text-lg font-semibold text-green-600">
          {totalCommits}
        </div>
        <div className="text-xs text-gray-500">Commits</div>
      </div>

      {/* Pull Requests Metric */}
      <div className="text-center">
        <div className="text-lg font-semibold text-blue-600">
          {totalPRs}
        </div>
        <div className="text-xs text-gray-500">PRs</div>
      </div>

      {/* Issues Metric */}
      <div className="text-center">
        <div className="text-lg font-semibold text-purple-600">
          {totalIssues}
        </div>
        <div className="text-xs text-gray-500">Issues</div>
      </div>

      {/* Estimated Hours Metric */}
      <div className="text-center">
        <div className="text-lg font-semibold text-orange-600">
          {totalManHoursMin}-{totalManHoursMax}h
        </div>
        <div className="text-xs text-gray-500">Est. Hours</div>
      </div>
    </div>
  );
}

