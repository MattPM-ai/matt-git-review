"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/components/auth/user-profile";

interface AppHeaderProps {
  variant: 'dashboard' | 'org';
  orgName?: string;
  showBackButton?: boolean;
  showAllDashboardsLink?: boolean;
}

export function AppHeader({
  variant,
  orgName,
  showBackButton = false,
  showAllDashboardsLink = false,
}: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's browser history to go back to
    if (window.history.length > 1) {
      router.back();
    } else {
      // No history, fallback to dashboard
      router.push('/dashboard');
    }
  };

  return (
    <header className="bg-white shadow-sm flex-shrink-0 border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Back button - Show when enabled */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}

            {/* Matt PM Logo - Icon only on mobile, full branding on desktop */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <Image
                src="/icon.png"
                alt="Matt PM"
                width={variant === 'dashboard' ? 28 : 24}
                height={variant === 'dashboard' ? 28 : 24}
                className={variant === 'dashboard' ? 'w-7 h-7' : 'w-6 h-6'}
              />
              <span className="hidden lg:inline text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                Matt PM
              </span>
            </Link>

            {/* Separator - Always visible */}
            <div className="w-px h-6 bg-gray-300"></div>

            {/* Dynamic Title */}
            <h1 className={`font-semibold text-gray-900 truncate min-w-0 ${
              variant === 'dashboard' ? 'text-2xl' : 'text-lg sm:text-xl'
            }`}>
              {variant === 'dashboard' ? 'Organizations' : orgName}
            </h1>

            {/* Optional All Dashboards Link */}
            {showAllDashboardsLink && variant === 'org' && orgName && (
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
  );
}

