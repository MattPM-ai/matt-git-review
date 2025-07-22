import { validateGitHubOrgJWT } from './jwt-utils';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

interface DirectAuthOptions {
  jwtToken: string;
  orgName: string;
}

/**
 * Create a NextAuth session from a direct JWT token
 */
export async function createDirectAuthSession(options: DirectAuthOptions): Promise<boolean> {
  const { jwtToken, orgName } = options;

  try {
    // Validate the JWT token
    const validation = validateGitHubOrgJWT(jwtToken);
    
    if (!validation.isValid || !validation.payload) {
      console.error('Invalid JWT token for direct auth:', validation.error);
      return false;
    }

    // Create NextAuth session cookie
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const sessionMaxAge = 30 * 24 * 60 * 60; // 30 days
    
    // Create session token
    const sessionToken = await new SignJWT({
      directJWT: true,
      mattJwtToken: jwtToken,
      mattUser: {
        id: validation.payload.sub || validation.payload.username,
        login: validation.payload.username,
        name: validation.payload.name || validation.payload.username,
        avatar_url: validation.payload.avatar_url || '',
        html_url: validation.payload.html_url || '',
      },
      orgName,
      type: 'github_org',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + sessionMaxAge,
      processed: false,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    // Set the session cookie
    const cookieStore = await cookies();
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';

    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionMaxAge,
      path: '/',
    });

    return true;
  } catch (error) {
    console.error('Failed to create direct auth session:', error);
    return false;
  }
}

/**
 * Clear direct auth session
 */
export async function clearDirectAuthSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';

    cookieStore.delete(cookieName);
  } catch (error) {
    console.error('Failed to clear direct auth session:', error);
  }
}