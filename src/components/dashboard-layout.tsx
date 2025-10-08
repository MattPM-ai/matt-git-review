import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { UserProfile } from "@/components/auth/user-profile";

interface DashboardLayoutProps {
  orgName: string;
  title?: string;
  currentView?:
    | "standup"
    | "activity"
    | "performance"
    | "contributions"
    | "members"
    | "settings";
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
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Back button - Always visible, leftmost */}
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              {/* Matt PM Logo - Icon only on mobile, full branding on desktop */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 flex-shrink-0 group"
              >
                <Image
                  src="/icon.png"
                  alt="Matt PM"
                  width={24}
                  height={24}
                  className="w-6 h-6"
                />
                <span className="hidden lg:inline text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                  Matt PM
                </span>
              </Link>

              {/* Separator - Always visible */}
              <div className="w-px h-6 bg-gray-300"></div>

              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate min-w-0">
                {orgName}
              </h1>
              {process.env.NEXT_PUBLIC_SHOW_ALL_DASHBOARDS === "true" && (
                <Link
                  href={`/org/${orgName}/dashboards`}
                  className="text-sm text-gray-500 hover:text-gray-700 flex-shrink-0"
                >
                  All
                </Link>
              )}
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
            <div className="p-4 lg:p-6">{sidebar}</div>
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
