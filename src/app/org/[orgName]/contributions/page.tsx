import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ContributionsChart } from "@/components/contributions-chart";
import { QueryAuthHandler } from "@/components/query-auth-handler";

interface ContributionsPageProps {
  params: Promise<{
    orgName: string;
  }>;
  searchParams: Promise<{
    period?: "weekly" | "monthly";
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function ContributionsPage({
  params,
  searchParams,
}: ContributionsPageProps) {
  const { orgName } = await params;
  const session = await auth();

  if (!session) {
    return (
      <QueryAuthHandler requiredOrg={orgName}>
        <ContributionsPageContent params={{orgName}} searchParams={searchParams} />
      </QueryAuthHandler>
    );
  }

  return <ContributionsPageContent params={{orgName}} searchParams={searchParams} />;
}

async function ContributionsPageContent({
  params,
  searchParams,
}: {
  params: { orgName: string };
  searchParams: Promise<{
    period?: "weekly" | "monthly";
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { orgName } = params;
  const { period = "weekly", dateFrom, dateTo } = await searchParams;

  return (
    <DashboardLayout
      orgName={orgName}
      title="Contributions"
      currentView="contributions"
    >
      <ContributionsChart 
        orgName={orgName} 
        initialPeriod={period}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
      />
    </DashboardLayout>
  );
}