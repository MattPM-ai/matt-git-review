import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { mattAPI } from "@/lib/api";
import { AppHeader } from "@/components/app-header";

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
      const orgConfig = await mattAPI.getOrgConfig(orgName, session.mattJwtToken);
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

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgName } = await params;

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <AppHeader 
        variant="org" 
        orgName={orgName}
        showBackButton={true}
        showAllDashboardsLink={process.env.NEXT_PUBLIC_SHOW_ALL_DASHBOARDS === "true"}
      />
      <main className="flex-1 overflow-y-auto bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}