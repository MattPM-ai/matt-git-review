import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getOrgConfig } from "@/lib/org-config";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgName: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ orgName: string }> }): Promise<Metadata> {
  const { orgName } = await params;
  
  try {
    const session = await auth();
    if (session?.mattJwtToken) {
      const orgConfig = await getOrgConfig(orgName, session.mattJwtToken);
      const displayName = orgConfig.name || orgName;
      
      return {
        title: `${displayName} | Matt PM - Git Performance Ranking & Standup`,
        description: `Performance rankings and standup summaries for ${displayName} organization`,
      };
    }
  } catch (error) {
    // Fall back to using orgName if we can't fetch the config
    console.error('Failed to fetch org config for metadata:', error);
  }
  
  return {
    title: `${orgName} | Matt PM - Git Performance Ranking & Standup`,
    description: `Performance rankings and standup summaries for ${orgName} organization`,
  };
}

export default async function OrgLayout({ children }: OrgLayoutProps) {
  return <>{children}</>;
}