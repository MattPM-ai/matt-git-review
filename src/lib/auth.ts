import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { validateGitHubOrgJWT } from "./jwt-utils";

interface MattUser {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  image: string;
  mattJwtToken: string;
  mattUser: MattUser;
  orgName: string;
  isSubscriptionAuth: boolean;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email read:org",
        },
      },
    }),
    Credentials({
      id: "subscription",
      name: "Subscription",
      credentials: {
        subscriptionId: { label: "Subscription ID", type: "text" },
        requiredOrg: { label: "Required Organization", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.subscriptionId) {
            return null;
          }

          // Exchange subscription ID for JWT token
          const gitApiHost = process.env.NEXT_PUBLIC_GIT_API_HOST;
          if (!gitApiHost) {
            console.error("NEXT_PUBLIC_GIT_API_HOST is not configured");
            return null;
          }

          const tokenResponse = await fetch(
            `${gitApiHost}/email-subscriptions/${credentials.subscriptionId}/generate-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!tokenResponse.ok) {
            console.error("Token generation failed:", tokenResponse.status);
            return null;
          }

          const tokenData = await tokenResponse.json();
          const jwtToken = tokenData.token;

          if (!jwtToken) {
            console.error("No token in response");
            return null;
          }

          // Validate the JWT token
          const validation = validateGitHubOrgJWT(jwtToken);
          if (!validation.isValid || !validation.payload) {
            console.error("Invalid JWT token:", validation.error);
            return null;
          }

          // Check org access if required
          if (
            credentials.requiredOrg &&
            validation.orgName?.toLowerCase() !==
              (credentials.requiredOrg as string).toLowerCase()
          ) {
            console.error(
              `Access denied to organization: ${credentials.requiredOrg}`
            );
            return null;
          }

          // Return user object that will be passed to JWT callback
          return {
            id: validation.payload.sub || validation.payload.username || "",
            name: validation.payload.name || validation.payload.username || "",
            email: (validation.payload.email as string) || "",
            image: validation.payload.avatar_url || "",
            // Custom fields
            mattJwtToken: jwtToken,
            mattUser: {
              id: validation.payload.sub || validation.payload.username || "",
              login: validation.payload.username || "",
              name:
                validation.payload.name || validation.payload.username || "",
              avatar_url: validation.payload.avatar_url || "",
              html_url: validation.payload.html_url || "",
            },
            orgName: validation.orgName,
            isSubscriptionAuth: true,
          } as ExtendedUser;
        } catch (error) {
          console.error("Subscription auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Handle subscription-based authentication
      if (account?.provider === "subscription" && user) {
        // console.log("Processing subscription authentication");
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.mattJwtToken = (user as { mattJwtToken?: string }).mattJwtToken;
        token.mattUser = (user as { mattUser?: MattUser }).mattUser;
        token.orgName = (user as { orgName?: string }).orgName;
        token.isSubscriptionAuth = true;
        // console.log(
        //   "Subscription auth - mattJwtToken:",
        //   token.mattJwtToken ? "present" : "missing"
        // );
        return token;
      }

      // Initial GitHub sign in
      if (account && profile && account.provider === "github") {
        // console.log("New sign in - Access Token:", account.access_token);
        // console.log("Refresh Token:", account.refresh_token);
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.id = profile.id as string;
        token.name = profile.name || user?.name;
        token.email = profile.email || user?.email;
        token.picture = (profile.avatar_url as string) || user?.image;
        // GitHub tokens don't expire for OAuth apps, only for GitHub Apps
        // So we don't need to track expiration

        // Exchange GitHub token for JWT token from Matt API
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_GIT_API_HOST}/users/auth`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ access_token: account.access_token }),
            }
          );

          if (response.ok) {
            const authData = await response.json();
            token.mattJwtToken = authData.access_token;
            token.mattUser = authData.user;
            // console.log("Successfully exchanged GitHub token for JWT");
          } else {
            console.error(
              "Failed to exchange token with Matt API:",
              response.statusText
            );
            // Don't fail the sign-in process if Matt API is down
          }
        } catch (error) {
          console.error("Failed to authenticate with Matt API:", error);
          // Don't fail the sign-in process if Matt API is down
        }
      }

      // For subsequent requests, ensure we have the token (only for GitHub OAuth, not subscription auth)
      if (
        !token.accessToken &&
        !token.isSubscriptionAuth &&
        !token.directJWT &&
        token.id
      ) {
        console.error("Token lost access token, session might be corrupted");
        // Mark token as needing re-authentication but don't return null
        token.error = "NoAccessToken";
      }

      return token;
    },
    async session({ session, token }) {
      // console.log("Session callback", session, token);

      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);

        // Pass GitHub access token
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
          // console.log("Session created with GitHub access token");
        }

        // Pass JWT token from Matt API
        if (token.mattJwtToken) {
          session.mattJwtToken = token.mattJwtToken as string;
          session.mattUser = token.mattUser as typeof session.mattUser;
          // console.log("Session created with Matt JWT token");
        } else {
          console.warn("Session without Matt JWT token - API calls may fail");
        }

        // Pass along any errors
        if (token.error) {
          session.error = token.error as string;
        }

        // Pass subscription auth flag
        if (token.isSubscriptionAuth) {
          session.isSubscriptionAuth = true;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
});
