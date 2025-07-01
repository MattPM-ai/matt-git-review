import { auth } from "@/app/api/auth/[...nextauth]/route"
import { SignOutButton } from "./sign-out-button"

export async function UserProfile() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User avatar"}
            className="h-8 w-8 rounded-full"
          />
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {session.user.name}
          </p>
          <p className="text-xs text-gray-500">{session.user.email}</p>
        </div>
      </div>
      <SignOutButton />
    </div>
  )
}