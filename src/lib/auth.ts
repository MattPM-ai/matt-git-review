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
    async jwt({ token, account, profile, user }) {
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
            console.log("Successfully exchanged GitHub token for JWT");
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

      // For subsequent requests, ensure we have the token
      if (!token.accessToken && !token.directJWT && token.id) {
        console.error("Token lost access token, session might be corrupted");
        // Mark token as needing re-authentication but don't return null
        token.error = "NoAccessToken";
      }

      return token;
    },
    async session({ session, token }) {
      console.log("Session callback", session, token);

      // For direct JWT sessions, we might not have a user object initially
      if (!session.user && token.directJWT) {
        session.user = {
          id: (token.sub as string) || (token.id as string),
          name: token.name as string,
          email: token.email as string,
          image: token.picture as string,
        };
      }

      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);

        // Pass GitHub access token
        if (token.accessToken) {
          session.accessToken = token.accessToken as string;
          console.log("Session created with GitHub access token");
        }

        // Pass JWT token from Matt API
        if (token.mattJwtToken) {
          session.mattJwtToken = token.mattJwtToken as string;
          session.mattUser = token.mattUser as typeof session.mattUser;
          console.log("Session created with Matt JWT token");
        } else {
          console.warn("Session without Matt JWT token - API calls may fail");
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
