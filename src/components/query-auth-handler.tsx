"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { validateGitHubOrgJWT } from "@/lib/jwt-utils";
import { authenticatedFetch } from "@/lib/fetch-interceptor";

interface QueryAuthHandlerProps {
  requiredOrg?: string;
  children: React.ReactNode;
}

export function QueryAuthHandler({
  requiredOrg,
  children,
}: QueryAuthHandlerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [hasValidatedSession, setHasValidatedSession] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const processAuth = async () => {
      // Wait for session loading to complete
      if (status === "loading") {
        return;
      }

      // Check for query auth parameter
      const authToken = searchParams.get("_auth");

      if (authToken && !isProcessing) {
        setIsProcessing(true);

        try {
          // Validate the JWT token
          const validation = validateGitHubOrgJWT(authToken);

          if (!validation.isValid) {
            setError(validation.error || "Invalid authentication token");
            return;
          }

          // Check org access if required
          if (
            requiredOrg &&
            validation.orgName?.toLowerCase() !== requiredOrg.toLowerCase()
          ) {
            setError(`Access denied to organization: ${requiredOrg}`);
            return;
          }

          // Test if the token is still valid by making an authenticated request
          try {
            const mattApiUrl = process.env.NEXT_PUBLIC_GIT_API_HOST || '';
            const userResponse = await authenticatedFetch(`${mattApiUrl}/users/me`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
              },
            });

            if (!userResponse.ok) {
              setError("Authentication token is invalid or expired");
              return;
            }

            // Token is valid, proceed with session creation
          } catch (error) {
            console.error("Token validation error:", error);
            setError("Failed to validate authentication token");
            return;
          }

          // Store in sessionStorage for immediate use
          sessionStorage.setItem("direct_jwt_token", authToken);
          sessionStorage.setItem("direct_org_name", validation.orgName || "");

          // Create session via API route
          const response = await fetch("/api/auth/direct", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jwtToken: authToken,
              orgName: validation.orgName,
            }),
          });

          if (response.ok) {
            // Remove auth parameter from URL
            const url = new URL(window.location.href);
            url.searchParams.delete("_auth");
            window.history.replaceState({}, "", url.toString());

            // Force page refresh to load with new session
            window.location.reload();
          } else {
            setError("Failed to create authentication session");
          }
        } catch (error) {
          console.error("Auth processing error:", error);
          setError("Failed to process authentication");
        } finally {
          setIsProcessing(false);
        }
      } else if (!authToken && !session) {
        // No auth token in query params and no existing session
        // Check if we have a direct JWT token in sessionStorage
        const directToken =
          typeof window !== "undefined"
            ? sessionStorage.getItem("direct_jwt_token")
            : null;

        if (!directToken) {
          setNeedsAuth(true);
        } else {
          // We have a direct token in sessionStorage, validate it
          setIsProcessing(true);
          try {
            const mattApiUrl = process.env.NEXT_PUBLIC_GIT_API_HOST || '';
            const userResponse = await authenticatedFetch(`${mattApiUrl}/users/me`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${directToken}`,
              },
            });

            if (!userResponse.ok) {
              // Token is invalid, clear it and require auth
              sessionStorage.removeItem("direct_jwt_token");
              sessionStorage.removeItem("direct_org_name");
              setNeedsAuth(true);
            }
          } catch (error) {
            console.error("Direct token validation error:", error);
            // Clear invalid token
            sessionStorage.removeItem("direct_jwt_token");
            sessionStorage.removeItem("direct_org_name");
            setNeedsAuth(true);
          } finally {
            setIsProcessing(false);
          }
        }
      }
    };

    processAuth();
  }, [searchParams, requiredOrg, isProcessing, session, status]);

  // Validate session token when we have a new session
  useEffect(() => {
    const validateSessionToken = async () => {
      if (session?.mattJwtToken && status === "authenticated" && !hasValidatedSession) {
        setHasValidatedSession(true);
        try {
          const mattApiUrl = process.env.NEXT_PUBLIC_GIT_API_HOST || '';
          const userResponse = await authenticatedFetch(`${mattApiUrl}/users/me`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.mattJwtToken}`,
            },
          });

          if (!userResponse.ok) {
            // Token is invalid, needs re-authentication
            console.error("Session token is invalid or expired");
            setNeedsAuth(true);
          }
        } catch (error) {
          console.error("Session token validation error:", error);
          setNeedsAuth(true);
        }
      }
    };

    validateSessionToken();
  }, [session?.mattJwtToken, status, hasValidatedSession]);

  useEffect(() => {
    if (needsAuth) {
      router.push("/");
    }
  }, [needsAuth, router]);

  // Show authentication needed state
  if (needsAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="text-blue-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19H6.5A2.5 2.5 0 014 16.5V8a2 2 0 012-2h8a2 2 0 012 2v8.5a2.5 2.5 0 01-2.5 2.5H16"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access this organization.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while processing auth
  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
