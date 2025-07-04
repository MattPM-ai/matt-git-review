import Link from "next/link";
import { UserProfile } from "@/components/auth/user-profile";

interface DashboardLayoutProps {
  orgName: string;
  title: string;
  currentView: "standup" | "activity";
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  orgName,
  title,
  currentView,
  sidebar,
  children,
}: DashboardLayoutProps) {
  const otherView = currentView === "standup" ? "activity" : "standup";
  const otherViewLabel = currentView === "standup" ? "Activity" : "Standup";

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white shadow-sm flex-shrink-0 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/org/${orgName}`}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-5 h-5"
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
              <h1 className="text-2xl font-semibold text-gray-900">
                {orgName} {title}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/org/${orgName}/${otherView}`}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Switch to {otherViewLabel} View →
              </Link>
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <div className="p-6">
            {sidebar}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}