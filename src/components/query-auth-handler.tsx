"use client";

import { useEffect, useState, useRef } from "react";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useValidatedSession } from "@/hooks/useValidatedSession";
import { signIn } from "next-auth/react";

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
  const [authAttempted, setAuthAttempted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useValidatedSession();
  const processedSubscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      // Wait for session loading to complete
      if (status === "loading") {
        return;
      }

      // Check for query auth parameter (subscription ID)
      const subscriptionId = searchParams.get("_auth");

      // Only process if we have a subscription ID and haven't already processed it
      if (
        subscriptionId &&
        !isProcessing &&
        processedSubscriptionRef.current !== subscriptionId
      ) {
        setIsProcessing(true);
        processedSubscriptionRef.current = subscriptionId;

        try {
          // Use NextAuth signIn with subscription provider
          const result = await signIn("subscription", {
            subscriptionId,
            requiredOrg,
            redirect: false,
          });

          if (result?.error) {
            console.error("Subscription sign in failed:", result.error);
            if (result.error === "CredentialsSignin") {
              setError("Subscription not found or expired");
            } else {
              setError("Failed to authenticate with subscription");
            }
            setAuthAttempted(true);
            return;
          }

          if (result?.ok) {
            // Remove auth parameter from URL
            const url = new URL(window.location.href);
            url.searchParams.delete("_auth");
            window.history.replaceState({}, "", url.toString());

            // Redirect or refresh to load with new session
            window.location.reload();
          } else {
            setError("Authentication failed");
            setAuthAttempted(true);
          }
        } catch (error) {
          console.error("Auth processing error:", error);
          setError("Failed to process authentication");
          setAuthAttempted(true);
        } finally {
          setIsProcessing(false);
        }
      } else if (!subscriptionId && !session && !authAttempted) {
        // No auth token in query params and no existing session
        setNeedsAuth(true);
      }
    };

    processAuth();
  }, [searchParams, requiredOrg, isProcessing, session, status, authAttempted]);

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
            <Shield className="mx-auto h-12 w-12" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access this organization.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium hover:cursor-pointer"
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
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
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
            <AlertTriangle className="mx-auto h-12 w-12" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium hover:cursor-pointer"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
