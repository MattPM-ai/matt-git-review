"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateOrgConfig, type UpdateOrgConfigParams } from "@/lib/org-config";
import { timezones } from "@/lib/timezones";
import countries from "@/lib/iso3166.json";

interface OrgInitialSetupProps {
  orgName: string;
  isEditMode?: boolean;
  initialConfig?: {
    country: string | null;
    timezone: number | null;
    preferredEmailTime: string | null;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
}

// Helper function to detect user's country from timezone
function getCountryFromTimezone(timezone: string): string {
  // Common timezone to country mappings
  const timezoneToCountry: Record<string, string> = {
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES',
    'Europe/Amsterdam': 'NL',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Europe/Helsinki': 'FI',
    'Europe/Warsaw': 'PL',
    'Europe/Prague': 'CZ',
    'Europe/Vienna': 'AT',
    'Europe/Zurich': 'CH',
    'Europe/Brussels': 'BE',
    'Europe/Dublin': 'IE',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Shanghai': 'CN',
    'Asia/Hong_Kong': 'HK',
    'Asia/Singapore': 'SG',
    'Asia/Bangkok': 'TH',
    'Asia/Jakarta': 'ID',
    'Asia/Manila': 'PH',
    'Asia/Kolkata': 'IN',
    'Asia/Dubai': 'AE',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Australia/Perth': 'AU',
    'Pacific/Auckland': 'NZ',
  };
  
  return timezoneToCountry[timezone] || '';
}

// Helper function to get timezone offset from browser timezone
function getTimezoneOffsetHours(): number {
  const offsetMinutes = new Date().getTimezoneOffset();
  return -offsetMinutes / 60; // Convert to hours and flip sign
}

export function OrgInitialSetup({ 
  orgName, 
  isEditMode = false,
  initialConfig 
}: OrgInitialSetupProps) {
  const router = useRouter();
  const { data: session } = useSession();
  
  // For edit mode, use initialConfig values
  // For initial setup, use auto-detected values as defaults
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState<number | "">("");
  const [preferredEmailTime, setPreferredEmailTime] = useState("09:00");
  const [dailyReport, setDailyReport] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect user's location on component mount
  useEffect(() => {
    if (isEditMode && initialConfig) {
      // Edit mode: use existing config
      setCountry(initialConfig.country || "");
      setTimezone(initialConfig.timezone ?? "");
      setPreferredEmailTime(initialConfig.preferredEmailTime || "09:00");
      setDailyReport(initialConfig.dailyReport ?? false);
      setWeeklyReport(initialConfig.weeklyReport ?? false);
      setMonthlyReport(initialConfig.monthlyReport ?? false);
    } else if (!isEditMode) {
      // Initial setup: auto-detect defaults
      
      // Auto-detect timezone
      try {
        const timezoneOffset = getTimezoneOffsetHours();
        
        // Find matching timezone in our list
        const matchingTimezone = timezones.find(tz => 
          Math.abs(tz.value - timezoneOffset) < 0.1 // Allow small floating point differences
        );
        
        if (matchingTimezone) {
          setTimezone(matchingTimezone.value);
        }
      } catch (err) {
        console.log("Could not auto-detect timezone:", err);
      }
      
      // Auto-detect country - try IP-based detection first
      async function detectCountry() {
        try {
          // Try IP-based detection using ipapi.co (free, no API key required)
          const response = await fetch('https://ipapi.co/json/');
          if (response.ok) {
            const data = await response.json();
            if (data.country_code) {
              setCountry(data.country_code);
              return; // Success, no need for fallback
            }
          }
        } catch (err) {
          console.log("IP-based country detection failed:", err);
        }
        
        // Fallback: Try to detect from browser timezone
        try {
          const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const detectedCountry = getCountryFromTimezone(browserTimezone);
          if (detectedCountry) {
            setCountry(detectedCountry);
          }
        } catch (err) {
          console.log("Timezone-based country detection failed:", err);
        }
      }
      
      detectCountry();
    }
  }, [isEditMode, initialConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!country || timezone === "") {
      setError("Please fill in all required fields");
      return;
    }

    if (!session?.mattJwtToken) {
      setError("Authentication required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const config: UpdateOrgConfigParams = {
        country,
        timezone: Number(timezone),
        preferredEmailTime,
        dailyReport,
        weeklyReport,
        monthlyReport,
      };

      await updateOrgConfig(orgName, config, session.mattJwtToken);
      
      if (isEditMode) {
        router.push(`/org/${orgName}`);
      } else {
        // For initial setup, redirect to performance page
        router.push(`/org/${orgName}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditMode ? "Organization Settings" : "Welcome to Matt Git Review"}
          </h1>
          <p className="text-gray-600">
            {isEditMode 
              ? `Update settings for ${orgName}`
              : "Let's set up your organization to get started with automated reports"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a country</option>
              {countries.map((c) => (
                <option key={c["alpha-2"]} value={c["alpha-2"]}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone <span className="text-red-500">*</span>
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select a timezone</option>
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Email Time */}
          <div>
            <label htmlFor="emailTime" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Email Time
            </label>
            <input
              type="time"
              id="emailTime"
              value={preferredEmailTime}
              onChange={(e) => setPreferredEmailTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Time when you prefer to receive email reports (in your selected timezone)
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isEditMode && (
              <button
                type="button"
                onClick={() => router.push(`/org/${orgName}`)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
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
                isEditMode ? "Save Changes" : "Complete Setup"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}