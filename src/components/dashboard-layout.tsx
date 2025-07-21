import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";

interface DashboardLayoutProps {
  orgName: string;
  title?: string;
  currentView?: "standup" | "activity" | "performance" | "contributions";
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  orgName,
  sidebar,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm flex-shrink-0 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Link
                href={`/org/${orgName}`}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate min-w-0">
                {orgName}
              </h1>
            </div>
            <div className="flex-shrink-0">
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main content with optional sidebar */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {/* Sidebar - only show if provided */}
        {sidebar && (
          <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            <div className="p-4 lg:p-6">
              {sidebar}
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}