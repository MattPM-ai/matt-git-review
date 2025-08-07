"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function OrgManagePage() {
  const params = useParams();
  const orgName = params.orgName as string;
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
            <svg
              className="animate-spin h-8 w-8 mx-auto text-indigo-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
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
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
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
        <div className="bg-white shadow rounded-lg">
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
              onClick={() => router.push(`/org/${orgName}/members`)}
              className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left hover:cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
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
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* Organization Configuration */}
            <button
              onClick={() => router.push(`/org/${orgName}/settings`)}
              className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left hover:cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
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
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Back to Organization */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push(`/org/${orgName}`)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to {orgName}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
