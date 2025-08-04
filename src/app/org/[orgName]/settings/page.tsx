"use client";

import { useEffect, useState } from "react";
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
    timezone: number | null;
    preferredEmailTime: string | null;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
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
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
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