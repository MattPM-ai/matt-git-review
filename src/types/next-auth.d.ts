import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
    accessToken?: string
    error?: string
  }
  
  interface JWT {
    accessToken?: string
    refreshToken?: string
    id?: string
    accessTokenExpires?: number
    error?: string
  }
}