"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { getOrgConfig } from "@/lib/org-config";
import { OrgInitialSetup } from "@/components/org-initial-setup";

export default function OrgSettingsPage() {
  const params = useParams();
  const orgName = params.orgName as string;
  const { data: session } = useSession();
  
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<{
    country: string | null;
    timezone: string | null;
    preferredEmailTime: string | null;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    sendEmptyWeekdayReports: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      if (!session?.mattJwtToken) {
        setIsLoading(false);
        setError("Authentication required");
        return;
      }

      try {
        const orgConfig = await getOrgConfig(orgName, session.mattJwtToken);
        setConfig(orgConfig);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch org config:", err);
        setError("Failed to load organization settings");
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, [orgName, session?.mattJwtToken]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <div className="mb-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          </div>
          <p className="text-gray-900 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <OrgInitialSetup
      orgName={orgName}
      isEditMode={true}
      initialConfig={config || undefined}
    />
  );
}