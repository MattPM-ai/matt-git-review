"use client"

import { SessionProvider } from "next-auth/react"
import { SessionHandler } from "./auth/session-handler"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionHandler>{children}</SessionHandler>
    </SessionProvider>
  )
}