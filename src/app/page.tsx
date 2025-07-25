import { auth } from "@/lib/auth"
import { SignInButton } from "@/components/auth/sign-in-button"
import { redirect } from "next/navigation"

interface HomeProps {
  searchParams: Promise<{
    setup_redirect?: string
  }>
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams
  const session = await auth()

  if (session) {
    // If there's a setup redirect, go there instead of dashboard
    if (params.setup_redirect) {
      redirect(decodeURIComponent(params.setup_redirect))
    }
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-900"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Connect Your GitHub Organization
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in with GitHub to connect your organization to our app
            </p>
          </div>

          <div className="rounded-lg bg-white p-8 shadow">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  What we&apos;ll access:
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg
                      className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Your GitHub profile information
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Your email address
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Organizations you belong to
                  </li>
                </ul>
              </div>

              <div className="flex justify-center">
                <SignInButton />
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <a href="#" className="underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}