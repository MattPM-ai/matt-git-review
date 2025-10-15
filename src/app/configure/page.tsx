import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { AlertTriangle, BookMarked } from "lucide-react";

interface ConfigurePageProps {
  searchParams: Promise<{
    installation_id?: string;
  }>;
}

interface Repository {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  visibility: string;
  updated_at: string;
}

async function getInstallationRepos(
  accessToken: string,
  installationId: string
) {
  const response = await fetch(
    `https://api.github.com/user/installations/${installationId}/repositories`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  return response.json();
}

async function getInstallation(accessToken: string, installationId: string) {
  const response = await fetch("https://api.github.com/user/installations", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch installations");
  }

  const data = await response.json();
  return data.installations.find(
    (inst: { id: number }) => inst.id === parseInt(installationId)
  );
}

export default async function ConfigurePage({
  searchParams,
}: ConfigurePageProps) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const params = await searchParams;
  const { installation_id } = params;

  if (!installation_id) {
    redirect("/dashboard");
  }

  let installation = null;
  let repositories = [];
  let error = null;

  try {
    installation = await getInstallation(session.accessToken!, installation_id);
    if (!installation) {
      error = "Installation not found";
    } else {
      const repoData = await getInstallationRepos(
        session.accessToken!,
        installation_id
      );
      repositories = repoData.repositories || [];
    }
  } catch {
    error = "Failed to load installation data";
  }

  if (error || !installation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h1>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={installation.account.avatar_url}
                  alt={installation.account.login}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Configure {installation.account.login}
                  </h1>
                  <p className="text-gray-600">
                    Select repositories and configure settings for your GitHub
                    App
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Repositories
                </h2>

                {repositories.length === 0 ? (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-yellow-800">
                      No repositories are available. The app may have been
                      installed with no repository access.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {repositories.map((repo: Repository) => (
                      <div
                        key={repo.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BookMarked className="h-5 w-5 text-gray-400" />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {repo.name}
                              </h3>
                              {repo.description && (
                                <p className="text-sm text-gray-500">
                                  {repo.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                {repo.language && (
                                  <span className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    {repo.language}
                                  </span>
                                )}
                                <span>{repo.visibility}</span>
                                <span>
                                  Updated{" "}
                                  {new Date(
                                    repo.updated_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:cursor-pointer">
                            Configure
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <div className="flex gap-4 justify-end">
                  <a
                    href="/dashboard"
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors hover:cursor-pointer"
                  >
                    Back to Dashboard
                  </a>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors hover:cursor-pointer">
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
