import standupData from "./standup.json";
import { StandupResponse, StandupSummary } from "@/lib/matt-api";

/**
 * Loads the standup.json mock data and parses it into the StandupResponse[] schema.
 * Dates are converted to Date objects where appropriate.
 */
export function loadMockStandup(): StandupResponse[] {
  function parseStandupSummary(summary: any): StandupSummary {
    return {
      ...summary,
      date: summary.date ? new Date(summary.date) : undefined,
      dailyStandups: summary.dailyStandups
        ? summary.dailyStandups.map(parseStandupSummary)
        : undefined,
    };
  }

  // standupData is StandupResponse[] but with date as string, so we need to convert
  return (standupData as any[]).map((entry) => ({
    ...entry,
    standup: parseStandupSummary(entry.standup),
  }));
}
