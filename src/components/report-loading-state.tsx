"use client";

import { useState, useEffect, useRef } from "react";

export function ReportLoadingState() {
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset progress to 0 when component mounts
    setProgress(0);
    
    // Start the progress animation after a brief delay
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const targetDuration = 120000; // 2 minutes
      const maxProgress = 80; // Never reach 100%

      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const timeRatio = Math.min(elapsed / targetDuration, 1);
        
        // Non-linear progress: fast at start, slow at end
        // Using an exponential decay function
        const newProgress = maxProgress * (1 - Math.exp(-5 * timeRatio));
        
        setProgress(Math.min(newProgress, maxProgress));
        
        if (timeRatio >= 1) {
          clearInterval(progressInterval);
          progressIntervalRef.current = null;
        }
      }, 100); // Update every 100ms for smooth animation
      
      progressIntervalRef.current = progressInterval;
    }, 50); // Small delay to ensure 0% is visible

    // Cleanup function
    return () => {
      clearTimeout(timeout);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const getStatusMessage = () => {
    if (progress < 20) {
      return "Fetching user data...";
    } else if (progress < 40) {
      return "Analyzing contributions...";
    } else if (progress < 60) {
      return "Processing activities...";
    } else if (progress < 80) {
      return "Calculating metrics...";
    } else {
      return "Finalizing report...";
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        <p className="text-center text-gray-600 font-medium">
          Report is generating...
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
        <p className="text-center text-sm text-gray-500">
          {getStatusMessage()}
        </p>
      </div>
    </div>
  );
}