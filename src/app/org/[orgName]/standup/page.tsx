import { auth } from "@/lib/auth";
import { QueryAuthHandler } from "@/components/query-auth-handler";
import { OrgStandupClientContent } from "@/components/org-standup-client-content";

interface StandupPageProps {
  params: Promise<{
    orgName: string;
  }>;
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function StandupPage({
  params,
  searchParams,
}: StandupPageProps) {
  const { orgName } = await params;
  const searchParamsData = await searchParams;
  const session = await auth();

  if (!session) {
    return (
      <QueryAuthHandler requiredOrg={orgName}>
        <OrgStandupClientContent 
          orgName={orgName}
          searchParams={searchParamsData}
        />
      </QueryAuthHandler>
    );
  }

  return (
    <OrgStandupClientContent 
      orgName={orgName}
      searchParams={searchParamsData}
    />
  );
}

