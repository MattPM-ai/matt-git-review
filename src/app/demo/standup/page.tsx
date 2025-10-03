/**
 * PAGE: Standup Demo
 * 
 * PURPOSE: Public demo page showcasing mock standup summaries
 * 
 * FUNCTIONALITY:
 * - Displays mock standup data without authentication
 * - Uses StandupGrid component with sample team data
 * - Public route accessible to all visitors
 * 
 * ROUTE: /demo/standup
 */

import { StandupGrid } from '../../../../mockStandupDemo/components/StandupGrid';
import mockStandupData from '../../../../mockStandupDemo/data/mockStandupData.json';
import type { StandupResponse } from '../../../../mockStandupDemo/types/standup.types';

export default function StandupDemoPage() {
  const standups = mockStandupData as StandupResponse[];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-gray-50">
      {/* Header Section */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MattPM</h1>
              <p className="text-sm text-gray-500">AI-Powered Team Standups</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                Demo
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Automated Standup Reports from GitHub Activity
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              See how MattPM automatically generates comprehensive daily standup
              summaries by analyzing your team's commits, pull requests, and
              issues.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                AI-Generated Summaries
              </h3>
              <p className="text-sm text-gray-600">
                Intelligent analysis of code changes and activity patterns
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Time Estimates
              </h3>
              <p className="text-sm text-gray-600">
                Automatic work hour estimation based on activity complexity
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Team Insights
              </h3>
              <p className="text-sm text-gray-600">
                Track progress, identify blockers, and support your team
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Standup Grid Section */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <StandupGrid
              standups={standups}
              title="Example Team Standup Report"
              showHeader={true}
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Automate Your Standups?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Connect your GitHub organization and start generating AI-powered
            standup reports in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors font-semibold shadow-lg"
            >
              Get Started Free
            </a>
            <a
              href="/demo/standup"
              className="px-8 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors font-semibold border-2 border-white"
            >
              View Demo Again
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2025 MattPM. Automated standup reports powered by AI.
          </p>
          <p className="text-xs mt-2">
            This is a demo page showcasing sample data.
          </p>
        </div>
      </footer>
    </div>
  );
}

