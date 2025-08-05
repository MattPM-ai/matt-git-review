"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { updateSubscription, type UpdateSubscriptionParams } from "@/lib/members-api";

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: {
    id: string;
    email: string;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  } | null;
  memberName?: string;
  onSuccess: () => void;
}

export function ManageSubscriptionModal({
  isOpen,
  onClose,
  subscription,
  memberName,
  onSuccess,
}: ManageSubscriptionModalProps) {
  const { data: session } = useSession();
  const [dailyReport, setDailyReport] = useState(subscription?.dailyReport ?? false);
  const [weeklyReport, setWeeklyReport] = useState(subscription?.weeklyReport ?? false);
  const [monthlyReport, setMonthlyReport] = useState(subscription?.monthlyReport ?? false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // Reset form when subscription changes
  useEffect(() => {
    if (subscription) {
      setDailyReport(subscription.dailyReport);
      setWeeklyReport(subscription.weeklyReport);
      setMonthlyReport(subscription.monthlyReport);
    }
  }, [subscription]);

  const handleSave = useCallback(async () => {
    if (!subscription || !session?.mattJwtToken) {
      setError("Missing subscription or authentication");
      return;
    }

    setIsUpdating(true);
    setError("");

    try {
      const params: UpdateSubscriptionParams = {
        daily_report: dailyReport,
        weekly_report: weeklyReport,
        monthly_report: monthlyReport,
      };

      await updateSubscription(subscription.id, params, session.mattJwtToken);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subscription");
    } finally {
      setIsUpdating(false);
    }
  }, [
    subscription,
    session?.mattJwtToken,
    dailyReport,
    weeklyReport,
    monthlyReport,
    onSuccess,
    onClose,
  ]);

  if (!isOpen || !subscription) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:w-full sm:max-w-md animate-slide-up sm:animate-none">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Manage Subscription
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  {memberName ? `Managing subscription for ${memberName}` : `Managing subscription for ${subscription.email}`}
                </p>
              </div>

              {/* Email Reports */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Email Reports
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dailyReport}
                      onChange={(e) => setDailyReport(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      disabled={isUpdating}
                    />
                    <span className="text-sm text-gray-700">
                      Daily Report
                      <span className="block text-xs text-gray-500">
                        Receive daily standup summaries
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={weeklyReport}
                      onChange={(e) => setWeeklyReport(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      disabled={isUpdating}
                    />
                    <span className="text-sm text-gray-700">
                      Weekly Report
                      <span className="block text-xs text-gray-500">
                        Receive weekly performance summaries
                      </span>
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={monthlyReport}
                      onChange={(e) => setMonthlyReport(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      disabled={isUpdating}
                    />
                    <span className="text-sm text-gray-700">
                      Monthly Report
                      <span className="block text-xs text-gray-500">
                        Receive monthly performance summaries
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}