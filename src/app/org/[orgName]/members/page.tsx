"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ManageSubscriptionModal } from "@/components/manage-subscription-modal";
import {
  getOrgMembers,
  getExternalSubscriptions,
  deleteSubscription,
  type ExternalSubscription,
  type MembersResponse,
} from "@/lib/members-api";
import Image from "next/image";

export default function OrgMembersPage() {
  const params = useParams();
  const orgName = params.orgName as string;
  const { data: session, status } = useSession();
  
  const [membersData, setMembersData] = useState<MembersResponse | null>(null);
  const [externalSubscriptions, setExternalSubscriptions] = useState<ExternalSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<{
    id: string;
    email: string;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  } | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string | undefined>();
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        getOrgMembers(orgName, session.mattJwtToken),
        getExternalSubscriptions(orgName, session.mattJwtToken),
      ]);

      setMembersData(membersResponse);
      setExternalSubscriptions(externalsResponse);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [orgName, session?.mattJwtToken, hasGitHubUserAccess]);

  useEffect(() => {
    if (status !== "loading") {
      fetchData();
    }
  }, [fetchData, status]);

  const handleManageSubscription = useCallback((
    subscription: { id: string; email: string; dailyReport: boolean; weeklyReport: boolean; monthlyReport: boolean },
    memberName?: string
  ) => {
    setSelectedSubscription(subscription);
    setSelectedMemberName(memberName);
    setIsManageModalOpen(true);
  }, []);

  const handleDeleteSubscription = useCallback(async (subscriptionId: string) => {
    if (!session?.mattJwtToken || !confirm("Are you sure you want to delete this subscription?")) {
      return;
    }

    setDeletingId(subscriptionId);
    try {
      await deleteSubscription(subscriptionId, session.mattJwtToken);
      await fetchData(); // Refresh data
    } catch (err) {
      console.error("Failed to delete subscription:", err);
      alert(err instanceof Error ? err.message : "Failed to delete subscription");
    } finally {
      setDeletingId(null);
    }
  }, [session?.mattJwtToken, fetchData]);

  const handleModalSuccess = useCallback(() => {
    fetchData(); // Refresh data after successful update
  }, [fetchData]);

  if (status === "loading" || isLoading) {
    return (
      <DashboardLayout orgName={orgName} title="Members & Subscriptions" currentView="members">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24">
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
            <p className="mt-4 text-gray-600">Loading members...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasGitHubUserAccess) {
    return (
      <DashboardLayout orgName={orgName} title="Members & Subscriptions" currentView="members">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              This page is only accessible to users authenticated with GitHub. Please sign in with your GitHub account to manage organization members and subscriptions.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout orgName={orgName} title="Members & Subscriptions" currentView="members">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium">{error}</p>
            <button
              onClick={() => fetchData()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const gitMembers = membersData?.members || [];
  const externalEmails = externalSubscriptions.filter(sub => !sub.is_auto_created);

  return (
    <>
      <DashboardLayout orgName={orgName} title="Members & Subscriptions" currentView="members">
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
                    <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
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
                          <span className="text-sm text-gray-400">No subscription</span>
                        )}
                        
                        {/* Manage button */}
                        {member.subscription && (
                          <button
                            onClick={() => handleManageSubscription({
                              id: member.subscription!.id,
                              email: member.subscription!.email,
                              dailyReport: member.subscription!.dailyReport,
                              weeklyReport: member.subscription!.weeklyReport,
                              monthlyReport: member.subscription!.monthlyReport,
                            }, member.name)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto flex-shrink-0"
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
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              External Emails ({externalEmails.length})
            </h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {externalEmails.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No external email subscriptions found
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {externalEmails.map((subscription) => (
                    <div key={subscription.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
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
                            onClick={() => handleManageSubscription({
                              id: subscription.id,
                              email: subscription.email,
                              dailyReport: subscription.daily_report,
                              weeklyReport: subscription.weekly_report,
                              monthlyReport: subscription.monthly_report,
                            })}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex-1 sm:flex-initial"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleDeleteSubscription(subscription.id)}
                            disabled={deletingId === subscription.id}
                            className="px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                          >
                            {deletingId === subscription.id ? "Deleting..." : "Delete"}
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