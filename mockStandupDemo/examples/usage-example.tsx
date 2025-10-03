/**
 * EXAMPLE: Standup Grid Usage
 * 
 * PURPOSE: Demonstrate how to integrate the StandupGrid component
 * 
 * This file shows various ways to use the standup components in your
 * landing page or application.
 */

import React from 'react';
import { StandupGrid } from '../components/StandupGrid';
import mockStandupData from '../data/mockStandupData.json';
import type { StandupResponse } from '../types/standup.types';

// ============================================================================
// EXAMPLE 1: Basic Usage
// ============================================================================

export function BasicStandupExample() {
  const standups = mockStandupData as StandupResponse[];

  return (
    <div className="container mx-auto px-4 py-8">
      <StandupGrid standups={standups} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Custom Title and No Header
// ============================================================================

export function CustomTitleExample() {
  const standups = mockStandupData as StandupResponse[];

  return (
    <div className="container mx-auto px-4 py-8">
      <StandupGrid
        standups={standups}
        title="Yesterday's Team Activity"
        showHeader={true}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Without Header (Minimal)
// ============================================================================

export function MinimalExample() {
  const standups = mockStandupData as StandupResponse[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <StandupGrid standups={standups} showHeader={false} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: With Custom Container Styling
// ============================================================================

export function StyledContainerExample() {
  const standups = mockStandupData as StandupResponse[];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <StandupGrid
          standups={standups}
          className="bg-white p-8 rounded-xl shadow-lg"
          title="Daily Development Activity"
        />
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Filtered Standups (Show Only Specific Team Members)
// ============================================================================

export function FilteredStandupsExample() {
  const allStandups = mockStandupData as StandupResponse[];
  
  // Show only team members with concerns
  const standupsWithConcerns = allStandups.filter(
    (standup) => standup.standup.concerns && standup.standup.concerns.trim()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <StandupGrid
        standups={standupsWithConcerns}
        title="Team Members Needing Support"
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Landing Page Hero Section
// ============================================================================

export function LandingPageHeroExample() {
  const standups = mockStandupData as StandupResponse[];

  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white py-20">
      <div className="container mx-auto px-4">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Team Standup Reports
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automatically generate comprehensive daily standups from your team's
            GitHub activity
          </p>
        </div>

        {/* Standup Grid */}
        <div className="max-w-5xl mx-auto">
          <StandupGrid standups={standups} showHeader={false} />
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
            Try It Free
          </button>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// EXAMPLE 7: Using Individual StandupCard Component
// ============================================================================

import { StandupCard } from '../components/StandupCard';

export function IndividualCardExample() {
  const standups = mockStandupData as StandupResponse[];
  const featuredStandup = standups[0]; // Show first team member

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Featured Team Member
      </h2>
      <StandupCard
        username={featuredStandup.username}
        name={featuredStandup.name}
        avatar_url={featuredStandup.avatar_url}
        standup={featuredStandup.standup}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: Responsive Grid Layout (Multiple Columns)
// ============================================================================

export function MultiColumnExample() {
  const standups = mockStandupData as StandupResponse[];

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Team Activity Dashboard
      </h2>
      
      {/* Grid layout with 2 columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  );
}

