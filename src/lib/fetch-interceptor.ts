import { signOut } from "next-auth/react";

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Check for JWT token in Authorization header
  const authHeader =
    init?.headers && "Authorization" in init.headers
      ? (init.headers as Record<string, string>)["Authorization"]
      : null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    // Check if token is empty or just whitespace
    if (!token || !token.trim()) {
      if (typeof window !== "undefined") {
        await signOut({
          redirectTo: "/",
          redirect: true,
        });
      }
      throw new UnauthorizedError("No JWT token provided");
    }

    if (checkTokenExpiration(token)) {
      // Handle expired token before making the request
      if (typeof window !== "undefined") {
        const isDirectAuth = document.cookie.includes("matt-direct-jwt");

        if (isDirectAuth) {
          const clearCookies = () => {
            document.cookie =
              "matt-direct-jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie =
              "matt-direct-jwt-org=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          };

          clearCookies();
          window.location.href = "/auth/error?error=TokenExpired";
        } else {
          await signOut({
            redirectTo: "/",
            redirect: true,
          });
        }
      }

      throw new UnauthorizedError("JWT token has expired");
    }
  } else if (init?.headers && "Authorization" in init.headers) {
    // Authorization header exists but doesn't have Bearer token
    if (typeof window !== "undefined") {
      await signOut({
        redirectTo: "/",
        redirect: true,
      });
    }
    throw new UnauthorizedError("Invalid authorization format");
  }

  const response = await fetch(input, init);

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      const isDirectAuth = document.cookie.includes("matt-direct-jwt");

      if (isDirectAuth) {
        const clearCookies = () => {
          document.cookie =
            "matt-direct-jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie =
            "matt-direct-jwt-org=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        };

        clearCookies();
        window.location.href = "/auth/error?error=TokenExpired";
      } else {
        await signOut({
          callbackUrl: `/`,
          redirect: true,
        });
      }
    }

    throw new UnauthorizedError("JWT token has expired or is invalid");
  }

  return response;
}

export function checkTokenExpiration(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp;

    if (!exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= exp;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
}
