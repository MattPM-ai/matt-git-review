/**
 * COMPONENT: StandupCard
 * 
 * PURPOSE: Render an individual team member's standup summary card
 * 
 * FUNCTIONALITY:
 * - Displays user information (avatar, name, username)
 * - Shows daily standup summary and detailed work items
 * - Renders activity metrics using StandupMetrics component
 * - Conditionally displays concerns section if present
 * - Includes time estimation rationale
 * 
 * STYLING:
 * - Card layout with shadow and hover effects
 * - Color-coded work item lists (green for completed, indigo for ongoing)
 * - Responsive padding and spacing
 */

import React from 'react';
import { StandupMetrics } from './StandupMetrics';
import type { StandupData } from '../types/standup.types';

interface StandupCardProps {
  username: string;
  name: string;
  avatar_url: string;
  standup: StandupData;
  className?: string;
}

export function StandupCard({
  username,
  name,
  avatar_url,
  standup,
  className = '',
}: StandupCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-all ${className}`}
    >
      {/* Header Section - Avatar and User Info */}
      <div className="flex items-center gap-4 mb-4">
        <img
          src={avatar_url}
          alt={name}
          className="w-12 h-12 rounded-full border-2 border-gray-200"
        />
        <div>
          <h3 className="font-bold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">@{username}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-4">
        <p className="text-gray-700 leading-relaxed">{standup.summary}</p>
      </div>

      {/* Metrics Section */}
      <div className="mb-4">
        <StandupMetrics
          totalCommits={standup.totalCommits}
          totalPRs={standup.totalPRs}
          totalIssues={standup.totalIssues}
          totalManHoursMin={standup.totalManHoursMin}
          totalManHoursMax={standup.totalManHoursMax}
        />
      </div>

      {/* Work Done Section */}
      {standup.workDone.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">
            Work Completed:
          </h4>
          <ul className="text-sm text-gray-700 space-y-1.5">
            {standup.workDone.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 font-medium">✓</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Working On Section */}
      {standup.workingOn.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">
            Currently Working On:
          </h4>
          <ul className="text-sm text-gray-700 space-y-1.5">
            {standup.workingOn.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-indigo-500 mt-0.5 font-medium">→</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Concerns Section (Conditional) */}
      {standup.concerns && standup.concerns.trim() && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-md">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">
            Concerns:
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            {standup.concerns}
          </p>
        </div>
      )}

      {/* Hours Rationale Section */}
      <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
        <strong>Time Estimate Rationale:</strong> {standup.manHoursRationale}
      </div>
    </div>
  );
}

