"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, Settings, Users, ArrowLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useOrgConfig } from "@/hooks/use-org-config";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function OrgManagePage() {
  const params = useParams();
  const orgLogin = params.orgName as string;
  const { orgName } = useOrgConfig(orgLogin);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user has github_user token (not github_org)
  const hasGitHubUserAccess = session?.user && !session.isSubscriptionAuth;

  if (status === "loading") {
    return (
      <DashboardLayout
        orgName={orgName}
        title="Organization Settings"
        currentView="settings"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600" />
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasGitHubUserAccess) {
    return (
      <DashboardLayout
        orgName={orgName}
        title="Organization Settings"
        currentView="settings"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Access Restricted
            </h3>
            <p className="text-gray-600">
              Organization settings are only accessible to users authenticated
              with GitHub. Please sign in with your GitHub account to manage
              organization settings.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      orgName={orgName}
      title="Organization Settings"
      currentView="settings"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Organization Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your organization configuration and email subscriptions
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Members & Subscriptions */}
            <button
              onClick={() => router.push(`/org/${orgLogin}/members`)}
              className="w-full p-4 bg-white hover:bg-gray-50 transition-colors text-left hover:cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Users className="w-6 h-6 text-gray-400 group-hover:text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Members & Email Subscriptions
                    </div>
                    <div className="text-sm text-gray-500">
                      Manage organization members and their email subscription
                      preferences
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-500" />
              </div>
            </button>

            {/* Organization Configuration */}
            <button
              onClick={() => router.push(`/org/${orgLogin}/settings`)}
              className="w-full p-4 bg-white rounded-b-lg hover:bg-gray-50 transition-colors text-left hover:cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <Settings className="w-6 h-6 text-gray-400 group-hover:text-gray-500" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      Organization Configuration
                    </div>
                    <div className="text-sm text-gray-500">
                      Update timezone, country, and email report preferences
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-500" />
              </div>
            </button>
          </div>
        </div>

        {/* Back to Organization */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push(`/org/${orgLogin}`)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {orgName}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
