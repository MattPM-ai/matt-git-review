"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, AlertTriangle, Mail } from "lucide-react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ManageSubscriptionModal } from "@/components/manage-subscription-modal";
import { useOrgConfig } from "@/hooks/use-org-config";
import {
  getOrgMembers,
  getExternalSubscriptions,
  deleteSubscription,
  type ExternalSubscription,
  type MembersResponse,
} from "@/lib/members-api";
import Image from "next/image";
import { ShareModal } from "@/components/share-modal";
import { type PeriodType } from "@/components/date-range-picker";

const getDefaultWeeklyRange = () => {
  const today = new Date();
  const lastWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
  
  return {
    dateFrom: format(lastWeekStart, "yyyy-MM-dd"),
    dateTo: format(lastWeekEnd, "yyyy-MM-dd"),
  };
};

export default function OrgMembersPage() {
  const params = useParams();
  const orgLogin = params.orgName as string;
  const { data: session, status } = useSession();
  const { orgName } = useOrgConfig(orgLogin);

  const [membersData, setMembersData] = useState<MembersResponse | null>(null);
  const [externalSubscriptions, setExternalSubscriptions] = useState<
    ExternalSubscription[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<{
    id: string;
    email: string;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  } | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<
    string | undefined
  >();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Default date range and period for ShareModal
  const [dateRange] = useState(getDefaultWeeklyRange());
  const [period] = useState<PeriodType>("weekly");

  // Check if user has github_user token (not github_org)
  const hasGitHubUserAccess = session?.user && !session.isSubscriptionAuth;

  const fetchData = useCallback(async () => {
    if (!session?.mattJwtToken || !hasGitHubUserAccess) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const [membersResponse, externalsResponse] = await Promise.all([
        getOrgMembers(orgLogin, session.mattJwtToken),
        getExternalSubscriptions(orgLogin, session.mattJwtToken),
      ]);

      setMembersData(membersResponse);
      setExternalSubscriptions(externalsResponse);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [orgLogin, session?.mattJwtToken, hasGitHubUserAccess]);

  useEffect(() => {
    if (status !== "loading") {
      fetchData();
    }
  }, [fetchData, status]);

  const handleManageSubscription = useCallback(
    (
      subscription: {
        id: string;
        email: string;
        dailyReport: boolean;
        weeklyReport: boolean;
        monthlyReport: boolean;
      },
      memberName?: string
    ) => {
      setSelectedSubscription(subscription);
      setSelectedMemberName(memberName);
      setIsManageModalOpen(true);
    },
    []
  );

  const handleDeleteSubscription = useCallback(
    async (subscriptionId: string) => {
      if (
        !session?.mattJwtToken ||
        !confirm("Are you sure you want to delete this subscription?")
      ) {
        return;
      }

      setDeletingId(subscriptionId);
      try {
        await deleteSubscription(subscriptionId, session.mattJwtToken);
        await fetchData(); // Refresh data
      } catch (err) {
        console.error("Failed to delete subscription:", err);
        alert(
          err instanceof Error ? err.message : "Failed to delete subscription"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [session?.mattJwtToken, fetchData]
  );

  const handleModalSuccess = useCallback(() => {
    fetchData(); // Refresh data after successful update
  }, [fetchData]);

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout
        orgName={orgName}
        title="Members & Subscriptions"
        currentView="members"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600" />
            <p className="mt-4 text-gray-600">Loading members...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasGitHubUserAccess) {
    return (
      <DashboardLayout
        orgName={orgName}
        title="Members & Subscriptions"
        currentView="members"
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
              This page is only accessible to users authenticated with GitHub.
              Please sign in with your GitHub account to manage organization
              members and subscriptions.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        orgName={orgName}
        title="Members & Subscriptions"
        currentView="members"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            </div>
            <p className="text-gray-900 font-medium">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium hover:cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const gitMembers = membersData?.members || [];
  const externalEmails = externalSubscriptions.filter(
    (sub) => !sub.is_auto_created
  );

  return (
    <>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        orgName={orgName}
        dateFrom={dateRange.dateFrom}
        dateTo={dateRange.dateTo}
        period={period}
      />
      <DashboardLayout
        orgName={orgName}
        title="Members & Subscriptions"
        currentView="members"
      >
        <div className="space-y-8">
          {/* Git Members Section */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Git Members ({gitMembers.length})
            </h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {gitMembers.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No git members found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {gitMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Image
                          src={member.avatarUrl}
                          alt={`${member.name} avatar`}
                          width={40}
                          height={40}
                          className="rounded-full flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            @{member.username} • {member.email || "No email"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3">
                        {/* Subscription status */}
                        {member.subscription ? (
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm">
                            {member.subscription.dailyReport && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Daily
                              </span>
                            )}
                            {member.subscription.weeklyReport && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                ✓ Weekly
                              </span>
                            )}
                            {member.subscription.monthlyReport && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                ✓ Monthly
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No subscription
                          </span>
                        )}

                        {/* Manage button */}
                        {member.subscription && (
                          <button
                            onClick={() =>
                              handleManageSubscription(
                                {
                                  id: member.subscription!.id,
                                  email: member.subscription!.email,
                                  dailyReport: member.subscription!.dailyReport,
                                  weeklyReport:
                                    member.subscription!.weeklyReport,
                                  monthlyReport:
                                    member.subscription!.monthlyReport,
                                },
                                member.name
                              )
                            }
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto flex-shrink-0 hover:cursor-pointer"
                          >
                            Manage
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* External Emails Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                External Emails ({externalEmails.length})
              </h2>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="hidden sm:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors hover:cursor-pointer"
                title="Invite external email"
              >
                <svg fill="#000000" viewBox="-2 -2 24 24" className="w-5 h-5">
                  <path d="M16 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7.928 9.24a4.02 4.02 0 0 1-.026 1.644l5.04 2.537a4 4 0 1 1-.867 1.803l-5.09-2.562a4 4 0 1 1 .083-5.228l5.036-2.522a4 4 0 1 1 .929 1.772L7.928 9.24zM4 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                </svg>
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {externalEmails.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No external email subscriptions found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {externalEmails.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {subscription.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            External subscription
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3">
                        {/* Subscription status */}
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-sm">
                          {subscription.daily_report && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Daily
                            </span>
                          )}
                          {subscription.weekly_report && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              ✓ Weekly
                            </span>
                          )}
                          {subscription.monthly_report && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              ✓ Monthly
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            onClick={() =>
                              handleManageSubscription({
                                id: subscription.id,
                                email: subscription.email,
                                dailyReport: subscription.daily_report,
                                weeklyReport: subscription.weekly_report,
                                monthlyReport: subscription.monthly_report,
                              })
                            }
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex-1 sm:flex-initial hover:cursor-pointer"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteSubscription(subscription.id)
                            }
                            disabled={deletingId === subscription.id}
                            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial hover:cursor-pointer"
                          >
                            {deletingId === subscription.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>

      {/* Manage Subscription Modal */}
      <ManageSubscriptionModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setSelectedSubscription(null);
          setSelectedMemberName(undefined);
        }}
        subscription={selectedSubscription}
        memberName={selectedMemberName}
        onSuccess={handleModalSuccess}
      />
    </>
  );
}
