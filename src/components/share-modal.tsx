"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getOrgConfig, type OrgConfig } from "@/lib/org-config";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgName: string;
  dateFrom: string;
  dateTo: string;
  period: string;
}

export function ShareModal({
  isOpen,
  onClose,
  orgName,
  dateFrom,
  dateTo,
  period,
}: ShareModalProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [subscribeToReports, setSubscribeToReports] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [shareSuccess, setShareSuccess] = useState(false);
  const [orgConfig, setOrgConfig] = useState<OrgConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Get the smallest enabled report frequency
  const getSmallestReportFrequency = useCallback(() => {
    if (!orgConfig) return null;

    if (orgConfig.dailyReport) return "daily";
    if (orgConfig.weeklyReport) return "weekly";
    if (orgConfig.monthlyReport) return "monthly";
    return null;
  }, [orgConfig]);

  const smallestFrequency = getSmallestReportFrequency();
  const hasAnyReports = smallestFrequency !== null;

  // Load org config when modal opens
  useEffect(() => {
    if (isOpen && !orgConfig && session?.mattJwtToken) {
      setIsLoadingConfig(true);
      getOrgConfig(orgName, session.mattJwtToken)
        .then(setOrgConfig)
        .catch(console.error)
        .finally(() => setIsLoadingConfig(false));
    }
  }, [isOpen, orgConfig, orgName, session?.mattJwtToken]);

  const handleShare = useCallback(async () => {
    if (!email) {
      setShareError("Please enter an email address");
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setShareError("Please enter a valid email address");
      return;
    }

    setIsSharing(true);
    setShareError("");

    try {
      const endpoint = subscribeToReports
        ? `${process.env.NEXT_PUBLIC_GIT_API_HOST}/email-subscriptions/invite-and-send`
        : `${process.env.NEXT_PUBLIC_GIT_API_HOST}/email-subscriptions/send-performance-email`;

      const body = subscribeToReports
        ? {
            email,
            organizationLogin: orgName,
            dailyReport: orgConfig?.dailyReport || false,
            weeklyReport: orgConfig?.weeklyReport || false,
            monthlyReport: orgConfig?.monthlyReport || false,
            dateFrom,
            dateTo,
            timeframe: period,
          }
        : {
            email,
            organizationLogin: orgName,
            dateFrom,
            dateTo,
            timeframe: period,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.mattJwtToken && {
            Authorization: `Bearer ${session.mattJwtToken}`,
          }),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to share report");
      }

      setShareSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset state after closing
        setTimeout(() => {
          setEmail("");
          setShareSuccess(false);
          setShareError("");
          setSubscribeToReports(true);
        }, 300);
      }, 1500);
    } catch (error) {
      setShareError(
        error instanceof Error ? error.message : "Failed to share report"
      );
    } finally {
      setIsSharing(false);
    }
  }, [
    email,
    subscribeToReports,
    orgName,
    dateFrom,
    dateTo,
    period,
    session?.mattJwtToken,
    onClose,
    orgConfig,
  ]);

  if (!isOpen) return null;

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
                Share Report
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
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isSharing}
                />
              </div>

              {hasAnyReports && !isLoadingConfig && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subscribeToReports}
                    onChange={(e) => setSubscribeToReports(e.target.checked)}
                    className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isSharing}
                  />
                  <span className="text-sm text-gray-700">
                    Send {smallestFrequency} standup summaries to this email
                    <span className="block text-xs text-gray-500 mt-1">
                      They&apos;ll receive a {smallestFrequency} summary of team
                      activity and progress
                    </span>
                  </span>
                </label>
              )}

              {shareError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{shareError}</p>
                </div>
              )}

              {shareSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    Report shared successfully!
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium hover:cursor-pointer"
                disabled={isSharing}
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing || !email}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:cursor-pointer"
              >
                {isSharing ? (
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
                    Sharing...
                  </>
                ) : (
                  "Share Report"
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
