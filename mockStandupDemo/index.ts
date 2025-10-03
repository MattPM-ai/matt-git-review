/**
 * INDEX: Mock Standup Demo Package
 * 
 * PURPOSE: Centralized exports for easy importing
 * 
 * USAGE:
 * import { StandupGrid, mockStandupData, StandupResponse } from '@/mockStandupDemo';
 */

// Export all components
export { StandupGrid } from './components/StandupGrid';
export { StandupCard } from './components/StandupCard';
export { StandupMetrics } from './components/StandupMetrics';

// Export types
export type { StandupResponse, StandupData, DailyStandup } from './types/standup.types';

// Export mock data
export { default as mockStandupData } from './data/mockStandupData.json';

