"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { mattAPI, type OrgConfig } from "@/lib/api";

export function useOrgConfig(orgLogin: string) {
  const { data: session } = useSession();
  const [orgConfig, setOrgConfig] = useState<OrgConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrgConfig() {
      if (!session?.mattJwtToken) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const config = await mattAPI.getOrgConfig(orgLogin, session.mattJwtToken);
        setOrgConfig(config);
      } catch (err) {
        console.error("Failed to fetch org config:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch organization config");
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrgConfig();
  }, [orgLogin, session?.mattJwtToken]);

  return {
    orgConfig,
    orgName: orgConfig?.name || orgLogin,
    isLoading,
    error,
  };
}