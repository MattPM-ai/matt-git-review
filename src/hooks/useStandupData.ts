import { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import type { StandupResponse, StandupTask, StandupRequest } from '@/lib/matt-api';
import { mattAPI } from '@/lib/matt-api';
import { loadMockStandup } from '@/lib/mock/mockStandup';

interface UseStandupDataOptions {
  organizationLogin: string;
  dateFrom: string;
  dateTo: string;
  useMockWhenUnauthenticated?: boolean;
}

interface UseStandupDataReturn {
  standupData: StandupResponse[];
  isLoading: boolean;
  error: string | null;
  currentTask: StandupTask | null;
  fetchStandupData: (options?: Partial<UseStandupDataOptions>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useStandupData(options: UseStandupDataOptions): UseStandupDataReturn {
  const { data: session } = useSession();
  const [standupData, setStandupData] = useState<StandupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<StandupTask | null>(null);
  const fetchInProgressRef = useRef(false);

  const fetchStandupData = useCallback(async (overrideOptions?: Partial<UseStandupDataOptions>) => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log("Standup fetch already in progress, skipping...");
      return;
    }

    const finalOptions = { ...options, ...overrideOptions };

    fetchInProgressRef.current = true;
    setIsLoading(true);
    setError(null);
    setCurrentTask(null);

    try {
      let data: StandupResponse[];

      // Check if we have a valid session with JWT token
      if (!session?.mattJwtToken) {
        if (finalOptions.useMockWhenUnauthenticated) {
          console.log("No JWT token found, using mock data");
          data = loadMockStandup();
        } else {
          setError("Not authenticated. Please sign in.");
          return;
        }
      } else {
        // Build request for Matt API standup endpoint
        const standupRequest: StandupRequest = {
          organizationLogin: finalOptions.organizationLogin,
          dateFrom: finalOptions.dateFrom,
          dateTo: finalOptions.dateTo,
        };

        // Start the standup generation task
        const taskResponse = await mattAPI.generateStandup(session.mattJwtToken, standupRequest);

        // Poll the task until completion
        data = await mattAPI.pollStandupTask(
          session.mattJwtToken,
          taskResponse.taskId,
          (task: StandupTask) => {
            setCurrentTask(task);
            console.log(`Standup task ${task.id} status: ${task.status}`);
          }
        );
      }

      setStandupData(data);
    } catch (err) {
      console.error("Error fetching standup data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch standup data");
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [options, session?.mattJwtToken]);

  const refetch = useCallback(() => fetchStandupData(), [fetchStandupData]);

  return {
    standupData,
    isLoading,
    error,
    currentTask,
    fetchStandupData,
    refetch,
  };
}