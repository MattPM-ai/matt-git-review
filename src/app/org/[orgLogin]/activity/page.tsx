import { auth } from "@/lib/auth";
import { QueryAuthHandler } from "@/components/query-auth-handler";
import { OrgActivityClientContent } from "@/components/org-activity-client-content";

interface OrgActivityPageProps {
  params: Promise<{
    orgLogin: string;
  }>;
  searchParams: Promise<{
    user?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function OrgActivityPage({
  params,
  searchParams,
}: OrgActivityPageProps) {
  const paramsData = await params;
  const searchParamsData = await searchParams;
  const session = await auth();

  if (!session) {
    return (
      <QueryAuthHandler requiredOrg={paramsData.orgLogin}>
        <OrgActivityClientContent
          orgName={paramsData.orgLogin}
          searchParams={searchParamsData}
        />
      </QueryAuthHandler>
    );
  }

  return (
    <OrgActivityClientContent
      orgName={paramsData.orgLogin}
      searchParams={searchParamsData}
    />
  );
}