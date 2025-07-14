import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PerformanceReviewDashboard } from "@/components/performance-review-dashboard";

interface PerformancePageProps {
  params: Promise<{
    orgName: string;
  }>;
  searchParams: Promise<{
    period?: "daily" | "weekly" | "monthly";
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function PerformancePage({
  params,
  searchParams,
}: PerformancePageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { orgName } = await params;
  const { period = "weekly", dateFrom, dateTo } = await searchParams;

  return (
    <DashboardLayout
      orgName={orgName}
      title="Performance Review"
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