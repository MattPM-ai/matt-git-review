import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

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
    async jwt({ token, account, profile, trigger, user }) {
      console.log("JWT callback triggered:", trigger);

      // Initial sign in
      if (account && profile) {
        console.log("New sign in - Access Token:", account.access_token);
        console.log("Refresh Token:", account.refresh_token);
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.id = profile.id as string;
        token.name = profile.name || user?.name;
        token.email = profile.email || user?.email;
        token.picture = (profile.avatar_url as string) || user?.image;
        // GitHub tokens don't expire for OAuth apps, only for GitHub Apps
        // So we don't need to track expiration
      }

      // For subsequent requests, ensure we have the token
      if (!token.accessToken && token.id) {
        console.error("Token lost access token, session might be corrupted");
        // Mark token as needing re-authentication but don't return null
        token.error = "NoAccessToken";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
          console.log("Session created with access token", token.accessToken);
        } else {
          console.warn(
            "Session without access token - user needs to re-authenticate"
          );
          // Don't set accessToken if it's missing
        }

        // Pass along any errors
        if (token.error) {
          session.error = token.error as string;
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
