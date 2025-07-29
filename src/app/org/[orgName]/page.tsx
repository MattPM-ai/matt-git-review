import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PerformanceReviewDashboard } from "@/components/performance-review-dashboard";
import { QueryAuthHandler } from "@/components/query-auth-handler";

interface OrgPageProps {
  params: Promise<{
    orgName: string;
  }>;
  searchParams: Promise<{
    period?: "daily" | "weekly" | "monthly";
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function OrgPage({
  params,
  searchParams,
}: OrgPageProps) {
  const { orgName } = await params;
  const session = await auth();

  if (!session) {
    return (
      <QueryAuthHandler requiredOrg={orgName}>
        <OrgPageContent params={{orgName}} searchParams={searchParams} />
      </QueryAuthHandler>
    );
  }

  return <OrgPageContent params={{orgName}} searchParams={searchParams} />;
}

async function OrgPageContent({
  params,
  searchParams,
}: {
  params: { orgName: string };
  searchParams: Promise<{
    period?: "daily" | "weekly" | "monthly";
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { orgName } = params;
  const { period = "weekly", dateFrom, dateTo } = await searchParams;

  return (
    <DashboardLayout
      orgName={orgName}
      title="Performance & Standup"
      currentView="performance"
    >
      <PerformanceReviewDashboard
        orgName={orgName}
        initialPeriod={period}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
      />
    </DashboardLayout>
  );
}