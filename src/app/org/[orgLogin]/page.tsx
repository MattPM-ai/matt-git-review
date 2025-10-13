import { auth } from "@/lib/auth";
import { QueryAuthHandler } from "@/components/query-auth-handler";
import { OrgPageWrapper } from "@/components/org-page-wrapper";

interface OrgPageProps {
  params: Promise<{
    orgLogin: string;
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
  const { orgLogin } = await params;
  const { period = "weekly", dateFrom, dateTo } = await searchParams;
  const session = await auth();

  if (!session) {
    return (
      <QueryAuthHandler requiredOrg={orgLogin}>
        <OrgPageWrapper
          orgName={orgLogin}
          initialPeriod={period}
          initialDateFrom={dateFrom}
          initialDateTo={dateTo}
        />
      </QueryAuthHandler>
    );
  }

  return (
    <OrgPageWrapper
      orgName={orgLogin}
      initialPeriod={period}
      initialDateFrom={dateFrom}
      initialDateTo={dateTo}
    />
  );
}