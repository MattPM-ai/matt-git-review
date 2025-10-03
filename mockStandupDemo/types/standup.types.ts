/**
 * TYPE DEFINITIONS: Standup Data Structures
 * 
 * These interfaces define the shape of standup data returned from the API
 * and used throughout the standup components.
 */

/**
 * Individual standup data for a specific date
 */
export interface StandupData {
  date: string;
  summary: string;
  workDone: string[];
  workingOn: string[];
  concerns?: string;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
  manHoursRationale: string;
  dailyStandups?: DailyStandup[];
}

/**
 * Optional daily breakdown for multi-day standups
 */
export interface DailyStandup {
  date: string;
  summary: string;
  workDone: string[];
  workingOn: string[];
  concerns?: string;
  ongoingIssues?: any[];
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  totalManHoursMin: number;
  totalManHoursMax: number;
  manHoursRationale: string;
}

/**
 * Complete standup response for a single team member
 */
export interface StandupResponse {
  username: string;
  name: string;
  avatar_url: string;
  standup: StandupData;
}

