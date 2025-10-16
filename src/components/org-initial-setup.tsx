"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { updateOrgConfig, type UpdateOrgConfigParams } from "@/lib/org-config";
import { timezones } from "@/lib/timezones";
import countries from "@/lib/iso3166.json";
import { Loader2 } from "lucide-react";

interface OrgInitialSetupProps {
  orgName: string;
  isEditMode?: boolean;
  initialConfig?: {
    country: string | null;
    timezone: string | null;
    preferredEmailTime: string | null;
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    sendEmptyWeekdayReports: boolean;
  };
}

// Helper function to detect user's country from timezone
function getCountryFromTimezone(timezone: string): string {
  // Common timezone to country mappings
  const timezoneToCountry: Record<string, string> = {
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Denver": "US",
    "America/Los_Angeles": "US",
    "America/Toronto": "CA",
    "America/Vancouver": "CA",
    "Europe/London": "GB",
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Rome": "IT",
    "Europe/Madrid": "ES",
    "Europe/Amsterdam": "NL",
    "Europe/Stockholm": "SE",
    "Europe/Oslo": "NO",
    "Europe/Copenhagen": "DK",
    "Europe/Helsinki": "FI",
    "Europe/Warsaw": "PL",
    "Europe/Prague": "CZ",
    "Europe/Vienna": "AT",
    "Europe/Zurich": "CH",
    "Europe/Brussels": "BE",
    "Europe/Dublin": "IE",
    "Asia/Tokyo": "JP",
    "Asia/Seoul": "KR",
    "Asia/Shanghai": "CN",
    "Asia/Hong_Kong": "HK",
    "Asia/Singapore": "SG",
    "Asia/Bangkok": "TH",
    "Asia/Jakarta": "ID",
    "Asia/Manila": "PH",
    "Asia/Kolkata": "IN",
    "Asia/Dubai": "AE",
    "Australia/Sydney": "AU",
    "Australia/Melbourne": "AU",
    "Australia/Perth": "AU",
    "Pacific/Auckland": "NZ",
  };

  return timezoneToCountry[timezone] || "";
}

// Helper function to detect timezone using Intl API
function detectTimezoneFromBrowser(): string | null {
  try {
    // Get the current timezone identifier from the browser
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log("Browser detected timezone:", timeZone);

    // Check if this timezone is in our supported list
    const supportedTimezone = timezones.find((tz) => tz.value === timeZone);
    if (supportedTimezone) {
      console.log("Found exact match:", timeZone);
      return timeZone;
    }

    // Common aliases/mappings for timezones not in our list
    const fallbackMappings: Record<string, string> = {
      "Europe/Belfast": "Europe/London",
      "Europe/Edinburgh": "Europe/London",
      "Europe/Jersey": "Europe/London",
      "Europe/Guernsey": "Europe/London",
      "Europe/Isle_of_Man": "Europe/London",
      "America/Montreal": "America/Toronto",
      "America/Thunder_Bay": "America/Toronto",
      "America/Nipigon": "America/Toronto",
      "America/Pangnirtung": "America/Toronto",
      "America/Iqaluit": "America/Toronto",
      "America/Atikokan": "America/Toronto",
      "America/Winnipeg": "America/Chicago",
      "America/Phoenix": "America/Denver",
      "Asia/Calcutta": "Asia/Kolkata",
      "Asia/Saigon": "Asia/Bangkok",
    };

    if (
      fallbackMappings[timeZone] &&
      timezones.find((tz) => tz.value === fallbackMappings[timeZone])
    ) {
      console.log(`Mapping ${timeZone} to ${fallbackMappings[timeZone]}`);
      return fallbackMappings[timeZone];
    }

    // Return null if not supported - user will need to select manually
    console.log(
      `Browser timezone "${timeZone}" not in supported list, user will need to select manually`
    );
    return null;
  } catch (err) {
    console.log("Timezone detection failed:", err);
    return null;
  }
}

export function OrgInitialSetup({
  orgName,
  isEditMode = false,
  initialConfig,
}: OrgInitialSetupProps) {
  const router = useRouter();
  const { data: session } = useSession();

  // For edit mode, use initialConfig values
  // For initial setup, use auto-detected values as defaults
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState<string | "">("");
  const [preferredEmailTime, setPreferredEmailTime] = useState("09:00");
  const [dailyReport, setDailyReport] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [sendEmptyWeekdayReports, setSendEmptyWeekdayReports] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Auto-detect user's location on component mount
  useEffect(() => {
    if (isEditMode && initialConfig) {
      // Edit mode: use existing config
      setCountry(initialConfig.country || "");
      setTimezone(initialConfig.timezone ?? "");
      setPreferredEmailTime(initialConfig.preferredEmailTime || "09:00");
      setDailyReport(initialConfig.dailyReport ?? true);
      setWeeklyReport(initialConfig.weeklyReport ?? true);
      setMonthlyReport(initialConfig.monthlyReport ?? true);
      setSendEmptyWeekdayReports(initialConfig.sendEmptyWeekdayReports ?? false);
    } else if (!isEditMode) {
      // Initial setup: auto-detect defaults

      // Auto-detect timezone (DST-aware)
      try {
        const detectedOffset = detectTimezoneFromBrowser();

        if (detectedOffset !== null) {
          setTimezone(detectedOffset);
        }
      } catch (err) {
        console.log("Could not auto-detect timezone:", err);
      }

      // Auto-detect country - prioritize timezone-based detection for consistency
      async function detectCountry() {
        // First: Try to detect from browser timezone (more reliable for timezone consistency)
        try {
          const browserTimezone =
            Intl.DateTimeFormat().resolvedOptions().timeZone;
          console.log(
            "Using browser timezone for country detection:",
            browserTimezone
          );
          const detectedCountry = getCountryFromTimezone(browserTimezone);
          if (detectedCountry) {
            console.log("Country detected from timezone:", detectedCountry);
            setCountry(detectedCountry);
            return; // Success, consistent with timezone
          }
        } catch (err) {
          console.log("Timezone-based country detection failed:", err);
        }

        // Fallback: Try IP-based detection
        try {
          console.log("Falling back to IP-based country detection");
          const response = await fetch("https://ipapi.co/json/");
          if (response.ok) {
            const data = await response.json();
            if (data.country_code) {
              console.log("Country detected from IP:", data.country_code);
              setCountry(data.country_code);
              return;
            }
          }
        } catch (err) {
          console.log("IP-based country detection failed:", err);
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
        timezone: timezone as string,
        preferredEmailTime,
        dailyReport,
        weeklyReport,
        monthlyReport,
        sendEmptyWeekdayReports,
      };

      await updateOrgConfig(orgName, config, session.mattJwtToken);

      // Success - stop loading state before redirect
      setSuccessMessage("Settings updated successfully!");
      setIsSubmitting(false);

      // if (isEditMode) {
      //   router.push(`/org/${orgName}`);
      // } else {
      //   // For initial setup, force a refresh to re-check setup status
      //   window.location.reload();
      // }
      if (!isEditMode) {
        // For initial setup, force a refresh to re-check setup status
        window.location.reload();
      }
    } catch (err) {
      setSuccessMessage("");
      setError(
        err instanceof Error ? err.message : "Failed to save configuration"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen  flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditMode
              ? "Organization Settings"
              : "Welcome to Matt Git Review"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? `Update settings for ${orgName}`
              : "Let's set up your organization to get started with automated reports"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Country */}
          <div>
            <label
              htmlFor="country"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Timezone <span className="text-red-500">*</span>
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
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
            <label
              htmlFor="emailTime"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
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
              Time when you prefer to receive email reports (in your selected
              timezone)
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

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmptyWeekdayReports}
                  onChange={(e) => setSendEmptyWeekdayReports(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  Send Empty Weekday Reports
                  <span className="block text-xs text-gray-500">
                    Receive daily reports even when there&apos;s no activity on weekdays
                  </span>
                </span>
              </label>
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium hover:cursor-pointer"
                disabled={isSubmitting}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Complete Setup"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
