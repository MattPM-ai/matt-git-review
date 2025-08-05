export interface Member {
  id: string;
  userId: string;
  username: string;
  name: string;
  email: string | null;
  avatarUrl: string;
  role: string;
  joinedAt: string;
  subscription: {
    id: string;
    email: string;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    isAutoCreated: boolean;
    externallyManaged: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface MembersResponse {
  organization: {
    id: string;
    login: string;
    name: string;
    initialSetupAt: string;
  };
  members: Member[];
}

export interface ExternalSubscription {
  id: string;
  email: string;
  github_org_id: string;
  inviter_github_user_id: string;
  daily_report: boolean;
  weekly_report: boolean;
  monthly_report: boolean;
  is_auto_created: boolean;
  externally_managed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UpdateSubscriptionParams {
  daily_report: boolean;
  weekly_report: boolean;
  monthly_report: boolean;
}

export async function getOrgMembers(
  orgLogin: string,
  jwtToken: string
): Promise<MembersResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GIT_API_HOST}/organizations/${orgLogin}/members`,
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch organization members: ${response.statusText}`);
  }

  return response.json();
}

export async function getExternalSubscriptions(
  orgLogin: string,
  jwtToken: string
): Promise<ExternalSubscription[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GIT_API_HOST}/email-subscriptions/organization/${orgLogin}?external=true`,
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch external subscriptions: ${response.statusText}`);
  }

  return response.json();
}

export async function updateSubscription(
  subscriptionId: string,
  params: UpdateSubscriptionParams,
  jwtToken: string
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GIT_API_HOST}/email-subscriptions/${subscriptionId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update subscription: ${response.statusText}`);
  }
}

export async function deleteSubscription(
  subscriptionId: string,
  jwtToken: string
): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_GIT_API_HOST}/email-subscriptions/${subscriptionId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to delete subscription: ${response.statusText}`);
  }
}