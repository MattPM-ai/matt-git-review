import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getOrgConfig } from "@/lib/org-config";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgLogin: string;
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ orgLogin: string }> }): Promise<Metadata> {
  const { orgLogin } = await params;

  try {
    const session = await auth();
    if (session?.mattJwtToken) {
      const orgConfig = await getOrgConfig(orgLogin, session.mattJwtToken);
      const displayName = orgConfig.name || orgLogin;
      
      return {
        title: `${displayName} | Matt PM - Git Performance Ranking & Standup`,
        description: `Performance rankings and standup summaries for ${displayName} organization`,
      };
    }
  } catch (error) {
    // Fall back to using orgLogin if we can't fetch the config
    console.error('Failed to fetch org config for metadata:', error);
  }

  return {
    title: `${orgLogin} | Matt PM - Git Performance Ranking & Standup`,
    description: `Performance rankings and standup summaries for ${orgLogin} organization`,
  };
}

export default async function OrgLayout({ children }: OrgLayoutProps) {
  return <>{children}</>;
}