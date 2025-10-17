import standupData from "./standup.json";
import { StandupResponse } from "@/lib/api";

/**
 * Loads the standup.json mock data and returns it as StandupResponse[].
 * Dates remain as strings as per the updated API interface.
 */
export function loadMockStandup(): StandupResponse[] {
  // standupData is already in the correct format
  return standupData as StandupResponse[];
}
