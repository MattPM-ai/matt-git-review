"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  mattAPI,
  type ExternalSubscription,
  type UpdateSubscriptionParams,
} from "@/lib/api";
import { AlertTriangle, Loader2 } from "lucide-react";

export default function SubscriptionPage() {
  const params = useParams();
  // const orgLogin = params.orgName as string;
  const subscriptionId = params.subscriptionId as string;
  const { data: session, status } = useSession();

  const [subscription, setSubscription] = useState<ExternalSubscription | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [dailyReport, setDailyReport] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!session?.mattJwtToken) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
        const data = await mattAPI.getSubscription(subscriptionId, session.mattJwtToken);
      setSubscription(data);

      // Set form states
      setDailyReport(data.daily_report);
      setWeeklyReport(data.weekly_report);
      setMonthlyReport(data.monthly_report);
    } catch (err) {
      console.error("Failed to fetch subscription:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load subscription"
      );
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId, session?.mattJwtToken]);

  useEffect(() => {
    if (status !== "loading") {
      fetchSubscription();
    }
  }, [fetchSubscription, status]);

  const handleUpdate = useCallback(async () => {
    if (!session?.mattJwtToken) return;

    setIsUpdating(true);
    setError(null);

    try {
      const params: UpdateSubscriptionParams = {
        dailyReport,
        weeklyReport,
        monthlyReport,
      };

      await mattAPI.updateSubscription(subscriptionId, params, session.mattJwtToken);

      // Show success message
      const successMessage = document.createElement("div");
      successMessage.className =
        "fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50";
      successMessage.textContent = "Subscription updated successfully";
      document.body.appendChild(successMessage);

      setTimeout(() => {
        successMessage.remove();
      }, 3000);

      // Refresh subscription data
      await fetchSubscription();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update subscription"
      );
    } finally {
      setIsUpdating(false);
    }
  }, [
    subscriptionId,
    session?.mattJwtToken,
    dailyReport,
    weeklyReport,
    monthlyReport,
    fetchSubscription,
  ]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600" />
          <p className="mt-4 text-gray-600">Loading subscription...</p>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          </div>
          <p className="text-gray-900 font-medium">{error}</p>
          <button
            onClick={() => fetchSubscription()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium hover:cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Manage Email Subscription
            </h2>
            <p className="mt-1 text-sm text-gray-500">{subscription.email}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Email Reports */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Email Reports
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dailyReport}
                    onChange={(e) => setDailyReport(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isUpdating}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Daily Report
                    </span>
                    <span className="block text-xs text-gray-500">
                      Receive daily standup summaries via email
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyReport}
                    onChange={(e) => setWeeklyReport(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isUpdating}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Weekly Report
                    </span>
                    <span className="block text-xs text-gray-500">
                      Receive weekly performance summaries via email
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={monthlyReport}
                    onChange={(e) => setMonthlyReport(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isUpdating}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Monthly Report
                    </span>
                    <span className="block text-xs text-gray-500">
                      Receive monthly performance summaries via email
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:cursor-pointer"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}
