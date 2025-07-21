import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
    accessToken?: string
    mattJwtToken?: string
    mattUser?: {
      id: number
      login: string
      name: string
      avatar_url: string
      html_url: string
    }
    error?: string
  }
  
  interface JWT {
    accessToken?: string
    refreshToken?: string
    id?: string
    accessTokenExpires?: number
    mattJwtToken?: string
    mattUser?: {
      id: number
      login: string
      name: string
      avatar_url: string
      html_url: string
    }
    error?: string
  }
}