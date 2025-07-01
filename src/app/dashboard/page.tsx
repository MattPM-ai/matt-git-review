import { auth } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { UserProfile } from "@/components/auth/user-profile"

async function getGitHubOrgs(accessToken: string) {
  const response = await fetch("https://api.github.com/user/orgs", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch organizations")
  }

  return response.json()
}

async function checkAppInstallation(accessToken: string, orgLogin: string) {
  const response = await fetch(
    `https://api.github.com/orgs/${orgLogin}/installations`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  )

  if (!response.ok) {
    return { installed: false }
  }

  const data = await response.json()
  return {
    installed: data.total_count > 0,
    installations: data.installations || [],
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  let organizations = []
  let error = null

  try {
    organizations = await getGitHubOrgs(session.accessToken!)
  } catch (e) {
    error = "Failed to fetch organizations"
  }

  const githubAppSlug = process.env.GITHUB_APP_SLUG || "your-github-app-slug"

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Your GitHub Organizations
            </h2>
            <a
              href={`https://github.com/apps/${githubAppSlug}/installations/new`}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Install GitHub App
            </a>
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {organizations.length === 0 && !error && (
            <div className="rounded-md bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                Please add organization first if you don't see your organization.
              </p>
            </div>
          )}

          {organizations.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org: any) => (
                <div
                  key={org.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={org.avatar_url}
                      alt={org.login}
                      className="h-12 w-12 rounded-full"
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
                  <a
                    href={`/org/${org.login}`}
                    className="mt-4 block w-full rounded-md bg-gray-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}