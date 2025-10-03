/**
 * COMPONENT: StandupGrid
 * 
 * PURPOSE: Main container component that renders all standup cards
 * 
 * FUNCTIONALITY:
 * - Accepts array of standup responses and renders cards for each
 * - Optional header with title and subtitle
 * - Responsive grid layout with consistent spacing
 * - Supports custom className for styling overrides
 * 
 * INPUTS:
 * - standups: Array of StandupResponse objects
 * - className: Optional CSS classes
 * - title: Optional custom title
 * - showHeader: Toggle header visibility
 */

import React from 'react';
import { StandupCard } from './StandupCard';
import type { StandupResponse } from '../types/standup.types';

interface StandupGridProps {
  standups: StandupResponse[];
  className?: string;
  title?: string;
  showHeader?: boolean;
}

export function StandupGrid({
  standups,
  className = '',
  title = 'Team Standup Summaries',
  showHeader = true,
}: StandupGridProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Optional Header */}
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-gray-500">
            AI-generated daily standup summaries based on team activity
          </p>
        </div>
      )}

      {/* Standup Cards Grid */}
      <div className="space-y-4">
        {standups.map((standup) => (
          <StandupCard
            key={standup.username}
            username={standup.username}
            name={standup.name}
            avatar_url={standup.avatar_url}
            standup={standup.standup}
          />
        ))}
      </div>

      {/* Empty State */}
      {standups.length === 0 && (
        <div className="text-center py-12">
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
            No standup data available
          </p>
          <p className="text-sm text-gray-500">
            Add team members to see their standup summaries
          </p>
        </div>
      )}
    </div>
  );
}

