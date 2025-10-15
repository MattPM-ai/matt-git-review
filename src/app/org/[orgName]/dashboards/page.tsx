import { auth } from "@/lib/auth";
import { UserProfile } from "@/components/auth/user-profile";
import { QueryAuthHandler } from "@/components/query-auth-handler";
import Link from "next/link";
import { Activity, ChartNoAxesCombined, ChevronRight, FolderClock, ArrowLeft } from "lucide-react";

interface DashboardsPageProps {
  params: Promise<{
    orgName: string;
  }>;
}

export default async function DashboardsPage({ params }: DashboardsPageProps) {
  const { orgName } = await params;
  const session = await auth();

  // Only redirect if no session AND no query auth is being processed
  if (!session) {
    // Allow query auth to be processed client-side
    return (
      <QueryAuthHandler requiredOrg={orgName}>
        <DashboardsPageContent orgName={orgName} />
      </QueryAuthHandler>
    );
  }

  return <DashboardsPageContent orgName={orgName} />;
}

function DashboardsPageContent({ orgName }: { orgName: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <a
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate min-w-0">
                {orgName}
              </h1>
            </div>
            <div className="flex-shrink-0">
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Choose a Dashboard
          </h2>
          <p className="text-gray-600">
            Select which view you&apos;d like to see for {orgName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Activity Dashboard Card */}
          <Link
            href={`/org/${orgName}/activity`}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Activity Feed
              </h3>
              <p className="text-gray-600 mb-4">
                View detailed commit history, issues, pull requests, and filter
                by date or team member
              </p>
              <div className="flex items-center text-green-600 font-medium">
                View Activity
                <ChevronRight className="w-5 h-5 ml-2"/>
              </div>
            </div>
          </Link>

          {/* Performance & Standup Card */}
          <Link
            href={`/org/${orgName}/performance`}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <ChartNoAxesCombined className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Performance & Standup
              </h3>
              <p className="text-gray-600 mb-4">
                Analyze team performance with rankings, metrics, and detailed
                insights across daily, weekly, or monthly periods
              </p>
              <div className="flex items-center text-purple-600 font-medium">
                View Performance
                <ChevronRight className="w-5 h-5 ml-2"/>
              </div>
            </div>
          </Link>

          {/* Contributions Card */}
          <Link
            href={`/org/${orgName}/contributions`}
            className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <FolderClock className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Contributions
              </h3>
              <p className="text-gray-600 mb-4">
                View team contributions over time with man-hours visualization
                and rankings
              </p>
              <div className="flex items-center text-indigo-600 font-medium">
                View Contributions
                <ChevronRight className="w-5 h-5 ml-2"/>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
