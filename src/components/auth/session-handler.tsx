"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function SessionHandler({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
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