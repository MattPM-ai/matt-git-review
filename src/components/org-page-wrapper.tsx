"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600" />
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