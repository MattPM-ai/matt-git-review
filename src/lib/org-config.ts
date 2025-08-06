export interface OrgConfig {
  id: string;
  login: string;
  name: string;
  initialSetupAt: string | null;
  country: string | null;
  timezone: string | null;
  preferredEmailTime: string | null;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export interface UpdateOrgConfigParams {
  country: string;
  timezone: string;
  preferredEmailTime: string;
  dailyReport: boolean;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

export async function getOrgConfig(
  orgLogin: string,
  jwtToken: string
): Promise<OrgConfig> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GIT_API_HOST}/organizations/${orgLogin}/config`,
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch organization config: ${response.statusText}`);
  }

  return response.json();
}

export async function updateOrgConfig(
  orgLogin: string,
  config: UpdateOrgConfigParams,
  jwtToken: string
): Promise<OrgConfig> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GIT_API_HOST}/organizations/${orgLogin}/config`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(config),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update organization config: ${response.statusText}`);
  }

  return response.json();
}