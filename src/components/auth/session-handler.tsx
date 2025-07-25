"use client";

import { useValidatedSession } from "@/hooks/useValidatedSession";
import { useEffect, useState } from "react";

export function SessionHandler({ children }: { children: React.ReactNode }) {
  const { status } = useValidatedSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a bit before marking as ready to avoid flash of content
    if (status !== "loading") {
      setIsReady(true);
    }
  }, [status]);

  // Only show loading on initial load
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}