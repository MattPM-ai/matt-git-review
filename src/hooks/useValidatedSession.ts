"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/lib/fetch-interceptor";

export function useValidatedSession() {
  const { data: session, status, update } = useSession();
  const [isValidating, setIsValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);
  const router = useRouter();
  const validationInProgressRef = useRef(false);

  useEffect(() => {
    const validateToken = async () => {
      // Skip if already validating or no token to validate
      if (
        validationInProgressRef.current ||
        !session?.mattJwtToken ||
        status !== "authenticated" ||
        hasValidated
      ) {
        return;
      }

      validationInProgressRef.current = true;
      setIsValidating(true);

      try {
        const mattApiUrl = process.env.NEXT_PUBLIC_GIT_API_HOST || "";
        const userResponse = await authenticatedFetch(
          `${mattApiUrl}/users/me`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.mattJwtToken}`,
            },
          }
        );

        if (!userResponse.ok) {
          console.error("Matt JWT token is invalid or expired");
          // Sign out and redirect
          await signOut({ redirect: false });
          router.push("/");
        } else {
          // Token is valid
          setHasValidated(true);
        }
      } catch (error) {
        console.error("Error validating Matt JWT token:", error);
        // On error, sign out to be safe
        await signOut({ redirect: false });
        router.push("/");
      } finally {
        setIsValidating(false);
        validationInProgressRef.current = false;
      }
    };

    validateToken();
  }, [session?.mattJwtToken, status, hasValidated, router]);

  // Reset validation state when session changes
  useEffect(() => {
    if (!session?.mattJwtToken) {
      setHasValidated(false);
    }
  }, [session?.mattJwtToken]);

  return {
    data: session,
    status: isValidating ? "loading" : status,
    update,
    isValidating,
  };
}