"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getOrgConfig } from "@/lib/org-config";
import { useOrgConfig } from "@/hooks/use-org-config";
import { OrgInitialSetup } from "./org-initial-setup";
import { DashboardLayout } from "./dashboard-layout";
import { PerformanceReviewDashboard } from "./performance-review-dashboard";

interface OrgPageWrapperProps {
  orgName: string;
  initialPeriod?: "daily" | "weekly" | "monthly";
  initialDateFrom?: string;
  initialDateTo?: string;
}

export function OrgPageWrapper({
  orgName: orgLogin,
  initialPeriod,
  initialDateFrom,
  initialDateTo,
}: OrgPageWrapperProps) {
  const { data: session } = useSession();
  const { orgName } = useOrgConfig(orgLogin);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    async function checkSetupStatus() {
      if (!session?.mattJwtToken) {
        setIsLoading(false);
        return;
      }

      try {
        const config = await getOrgConfig(orgLogin, session.mattJwtToken);
        setNeedsSetup(!config.initialSetupAt);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch org config:", err);
        // If we can't fetch the config, assume setup is needed
        setNeedsSetup(true);
        setIsLoading(false);
      }
    }

    checkSetupStatus();
  }, [orgLogin, session?.mattJwtToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (needsSetup) {
    return <OrgInitialSetup orgName={orgLogin} />;
  }

  return (
    <DashboardLayout
      orgName={orgName}
      title="Performance & Standup"
      currentView="performance"
    >
      <PerformanceReviewDashboard
        orgName={orgLogin}
        initialPeriod={initialPeriod}
        initialDateFrom={initialDateFrom}
        initialDateTo={initialDateTo}
      />
    </DashboardLayout>
  );
}