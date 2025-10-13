import { redirect } from "next/navigation";

interface PerformancePageProps {
  params: Promise<{
    orgLogin: string;
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
  const { orgLogin } = await params;
  const searchParamsResolved = await searchParams;
  
  // Build query string from searchParams
  const queryString = new URLSearchParams();
  if (searchParamsResolved.period) queryString.append("period", searchParamsResolved.period);
  if (searchParamsResolved.dateFrom) queryString.append("dateFrom", searchParamsResolved.dateFrom);
  if (searchParamsResolved.dateTo) queryString.append("dateTo", searchParamsResolved.dateTo);
  
  const queryPart = queryString.toString() ? `?${queryString.toString()}` : "";

  // Redirect to the new org homepage which now shows performance
  redirect(`/org/${orgLogin}${queryPart}`);
}