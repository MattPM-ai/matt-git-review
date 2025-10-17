"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Settings, AlertTriangle } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { mattAPI, githubAPI, type GitHubOrganization } from "@/lib/api";

// Types are now imported from @/lib/api

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<GitHubOrganization[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResyncing, setIsResyncing] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || !session.accessToken) {
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    async function fetchAndCompareOrganizations() {
      if (!session?.accessToken) return;

      try {
        // Fetch organizations from GitHub API using githubAPI client
        const githubOrgs = await githubAPI.getUserOrganizations(session.accessToken);
        
        // Extract and sort GitHub org logins in lowercase
        const githubLogins = githubOrgs
          .map(org => org.login.toLowerCase())
          .sort();

        // Fetch organizations from Matt API if we have a JWT token
        if (session?.mattJwtToken) {
          try {
            const mattOrgs = await mattAPI.getOrganizations(session.mattJwtToken);
              
            // Extract and sort Matt API org logins in lowercase
            const mattLogins = mattOrgs
              .map(org => org.login.toLowerCase())
              .sort();

            // Compare the lists
            const areEqual = githubLogins.length === mattLogins.length &&
              githubLogins.every((login, index) => login === mattLogins[index]);

            // Force resync if lists are different
            if (!areEqual) {
              await forceResync();
            }
          } catch (mattError) {
            console.warn('Failed to fetch or compare Matt API organizations:', mattError);
            // Continue with GitHub orgs even if Matt API fails
          }
        }

        setOrganizations(githubOrgs);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch orgs:", e);
        setError("Failed to fetch organizations. Please sign in again.");

        // Auto sign out after showing error briefly
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    }

    async function forceResync() {
      if (!session?.accessToken) return;
      
      try {
        setIsResyncing(true);
        
        await mattAPI.authenticateUser(session.accessToken);
      } catch (error) {
        console.error('Failed to resync organizations:', error);
        // Don't show error to user as this is an automatic background process
      } finally {
        setIsResyncing(false);
      }
    }

    if (session?.accessToken) {
      fetchAndCompareOrganizations();
    }
  }, [session?.accessToken, session?.mattJwtToken, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto text-indigo-600" />
          <p className="mt-4 text-gray-600">
            {isResyncing ? 'Syncing organizations...' : 'Loading organizations...'}
          </p>
        </div>
      </div>
    );
  }

  if (!session || !session.accessToken) {
    return null;
  }

  const githubAppSlug = "matt-pm-ai";

  return (
    <>
      <div className="mb-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm">{error}</p>
            </div>
            <p className="text-xs mt-1">Signing out...</p>
          </div>
        )}
      </div>

      {!error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Existing Organizations */}
          {organizations.map((org) => (
            <div
              key={org.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <Image
                  src={org.avatar_url}
                  alt={org.login}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{org.login}</h3>
                  {org.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {org.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`/org/${org.login}`}
                  className="flex-1 rounded-md bg-gray-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  View Report
                </a>
                <a
                  href={`/org/${org.login}/manage`}
                  className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}

          {/* Add Organization Card */}
          <Link href={`https://github.com/apps/${githubAppSlug}/installations/new`}>
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-gray-400 hover:bg-gray-100 transition-colors hover:cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-500">
                    Add Organization
                  </h3>
                </div>
              </div>
              <div
                className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors hover:cursor-pointer flex items-center justify-center"
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Organization
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {organizations.length === 0 && !error && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md px-4">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Connect Your Organization
              </h2>
              <p className="text-gray-600 mb-6">
                Get started by connecting your GitHub organization to access
                performance rankings and standup summaries.
              </p>
            </div>
            <a
              href={`https://github.com/apps/${githubAppSlug}/installations/new`}
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors hover:cursor-pointer"
            >
              <Plus className="w-5 h-5 mr-2" />
              Connect Organization
            </a>
          </div>
        </div>
      )}
    </>
  );
}