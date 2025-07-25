import { useState, useCallback, useRef, useEffect } from 'react';
import { useValidatedSession } from '@/hooks/useValidatedSession';
import type { StandupResponse, StandupTask, StandupRequest } from '@/lib/matt-api';
import { mattAPI, NoActivityError } from '@/lib/matt-api';
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
  noActivity: boolean;
  currentTask: StandupTask | null;
  fetchStandupData: (options?: Partial<UseStandupDataOptions>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useStandupData(options: UseStandupDataOptions): UseStandupDataReturn {
  const { data: session } = useValidatedSession();
  const [standupData, setStandupData] = useState<StandupResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noActivity, setNoActivity] = useState(false);
  const [currentTask, setCurrentTask] = useState<StandupTask | null>(null);
  const fetchInProgressRef = useRef(false);
  const [directJWTToken, setDirectJWTToken] = useState<string | null>(null);

  // Check for direct JWT token from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('direct_jwt_token');
      setDirectJWTToken(token);
    }
  }, []);

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
    setNoActivity(false);
    setCurrentTask(null);

    try {
      let data: StandupResponse[];

      // Check if we have a valid session with JWT token or direct JWT
      const jwtToken = session?.mattJwtToken || directJWTToken;
      
      if (!jwtToken) {
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
        const taskResponse = await mattAPI.generateStandup(jwtToken, standupRequest);

        // Poll the task until completion
        data = await mattAPI.pollStandupTask(
          jwtToken,
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
      if (err instanceof NoActivityError) {
        setNoActivity(true);
        setStandupData([]);
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch standup data");
      }
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [options, session?.mattJwtToken, directJWTToken]);

  const refetch = useCallback(() => fetchStandupData(), [fetchStandupData]);

  return {
    standupData,
    isLoading,
    error,
    noActivity,
    currentTask,
    fetchStandupData,
    refetch,
  };
}