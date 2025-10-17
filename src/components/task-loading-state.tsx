"use client";

import type { StandupTask, TaskStatus } from "@/lib/api";

interface TaskLoadingStateProps {
  task: StandupTask | null;
}

export function TaskLoadingState({ task }: TaskLoadingStateProps) {
  const getStatusMessage = () => {
    if (!task) {
      return "Starting task...";
    }
    
    switch (task.status) {
      case "pending" as TaskStatus:
        return "Task is queued...";
      case "processing" as TaskStatus:
        return "Generating standup summaries...";
      case "completed" as TaskStatus:
        return "Task completed!";
      case "failed" as TaskStatus:
        return "Task failed";
      default:
        return "Processing...";
    }
  };

  const getProgress = () => {
    if (!task) return 10;
    
    switch (task.status) {
      case "pending" as TaskStatus:
        return 25;
      case "processing" as TaskStatus:
        // Show progress based on elapsed time (estimate 30 seconds for processing)
        if (task.started_at) {
          const elapsed = Date.now() - new Date(task.started_at).getTime();
          const estimatedDuration = 30000; // 30 seconds
          const progress = Math.min((elapsed / estimatedDuration) * 60 + 25, 85);
          return progress;
        }
        return 30;
      case "completed" as TaskStatus:
        return 100;
      case "failed" as TaskStatus:
        return 0;
      default:
        return 15;
    }
  };

  const progress = getProgress();
  const statusMessage = getStatusMessage();
  const isFailed = task?.status === ("failed" as TaskStatus);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-gray-600 font-medium">
          Report is generating...
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isFailed 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
            }`}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
        <div className="text-center space-y-1">
          <p className={`text-sm ${isFailed ? 'text-red-600' : 'text-gray-500'}`}>
            {statusMessage}
          </p>
          {task && (
            <div className="text-xs text-gray-400">
              Task ID: {task.id.substring(0, 8)}...
              {task.started_at && task.status === ("processing" as TaskStatus) && (
                <div className="mt-1">
                  Running for {Math.round((Date.now() - new Date(task.started_at).getTime()) / 1000)}s
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}