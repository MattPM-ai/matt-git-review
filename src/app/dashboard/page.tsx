import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserProfile } from "@/components/auth/user-profile";
import Image from "next/image";

interface Organization {
  id: number;
  login: string;
  description?: string;
  avatar_url: string;
}

async function getGitHubOrgs(accessToken: string) {
  const response = await fetch("https://api.github.com/user/orgs", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch organizations");
  }

  return response.json();
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.accessToken) {
    redirect("/");
  }

  let organizations = [];
  let error = null;

  try {
    organizations = await getGitHubOrgs(session.accessToken);
  } catch (e) {
    console.error("Failed to fetch orgs:", e);
    error = "Failed to fetch organizations. Please sign in again.";
  }

  const githubAppSlug = process.env.GITHUB_APP_SLUG || "your-github-app-slug";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <UserProfile />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Your GitHub Organizations
            </h2>

            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Existing Organizations */}
            {organizations.map((org: Organization) => (
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
                    View
                  </a>
                  <a
                    href={`/org/${org.login}/settings`}
                    className="rounded-md bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    title="Settings"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            ))}

            {/* Add Organization Skeleton Card */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-gray-400 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-500">
                    Add Organization
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Connect your GitHub organization
                  </p>
                </div>
              </div>
              <a
                href={`https://github.com/apps/${githubAppSlug}/installations/new`}
                className="mt-4 block w-full rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                + Add Organization
              </a>
            </div>
          </div>

          {organizations.length === 0 && !error && (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-4">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
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
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Connect Organization
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
