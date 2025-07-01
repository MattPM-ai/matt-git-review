import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Image from "next/image"

interface SetupPageProps {
  searchParams: Promise<{
    installation_id?: string
    setup_action?: string
    state?: string
  }>
}

export default async function GitHubSetupPage({ searchParams }: SetupPageProps) {
  const params = await searchParams
  const session = await auth()

  if (!session) {
    // Store installation details and redirect to login
    const urlParams = new URLSearchParams(params as Record<string, string>)
    redirect(`/?setup_redirect=${encodeURIComponent(`/github/setup?${urlParams.toString()}`)}`)
  }

  const { installation_id, setup_action } = params

  if (!installation_id || !setup_action) {
    redirect("/dashboard")
  }

  // Verify user has access to this installation
  let installationData = null
  let error = null

  try {
    const response = await fetch("https://api.github.com/user/installations", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      installationData = data.installations.find(
        (inst: { id: number }) => inst.id === parseInt(installation_id)
      )
    }
  } catch {
    error = "Failed to verify installation access"
  }

  if (!installationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Installation Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              {error || "Unable to find the GitHub App installation."}
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <svg
                  className="h-12 w-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Installation Successful!
              </h1>
              <p className="text-gray-600">
                Your GitHub App has been installed on{" "}
                <span className="font-medium">{installationData.account.login}</span>
              </p>
            </div>

            <div className="border rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={installationData.account.avatar_url}
                  alt={installationData.account.login}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {installationData.account.login}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {installationData.account.type}
                  </p>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Installation ID:</strong> {installationData.id}
                </p>
                <p className="mb-2">
                  <strong>Repository Access:</strong>{" "}
                  {installationData.repository_selection === "all"
                    ? "All repositories"
                    : `${installationData.repositories?.length || 0} selected repositories`}
                </p>
                <p>
                  <strong>Installed:</strong>{" "}
                  {new Date(installationData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Your app is now connected to this organization</li>
                <li>Configure repository-specific settings if needed</li>
                <li>Start using the app features</li>
              </ol>
            </div>

            <div className="flex gap-4 justify-center">
              <a
                href="/dashboard"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </a>
              <a
                href={`/configure?installation_id=${installation_id}`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Configure Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}