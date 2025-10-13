import { auth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ContributionsChart } from "@/components/contributions-chart";
import { QueryAuthHandler } from "@/components/query-auth-handler";

interface ContributionsPageProps {
  params: Promise<{
    orgLogin: string;
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
  const { orgLogin } = await params;
  const session = await auth();

  if (!session) {
    return (
      <QueryAuthHandler requiredOrg={orgLogin}>
        <ContributionsPageContent params={{orgLogin}} searchParams={searchParams} />
      </QueryAuthHandler>
    );
  }

  return <ContributionsPageContent params={{orgLogin}} searchParams={searchParams} />;
}

async function ContributionsPageContent({
  params,
  searchParams,
}: {
  params: { orgLogin: string };
  searchParams: Promise<{
    period?: "weekly" | "monthly";
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const { orgLogin } = params;
  const { period = "weekly", dateFrom, dateTo } = await searchParams;

  return (
    <DashboardLayout
      orgName={orgLogin}
      orgLogin={orgLogin}
      title="Contributions"
      currentView="contributions"
    >
      <ContributionsChart
        orgName={orgLogin}
        initialPeriod={period}
        initialDateFrom={dateFrom}
        initialDateTo={dateTo}
      />
    </DashboardLayout>
  );
}