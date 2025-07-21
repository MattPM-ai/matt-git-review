import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ContributionsChart } from "@/components/contributions-chart";

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
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { orgName } = await params;
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