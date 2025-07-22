import { NextRequest, NextResponse } from 'next/server';
import { validateGitHubOrgJWT } from '@/lib/jwt-utils';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    const { jwtToken, orgName } = await request.json();

    if (!jwtToken || !orgName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate the JWT token
    const validation = validateGitHubOrgJWT(jwtToken);
    
    if (!validation.isValid || !validation.payload) {
      return NextResponse.json({ 
        error: validation.error || 'Invalid JWT token' 
      }, { status: 401 });
    }

    // Verify org matches
    if (validation.orgName?.toLowerCase() !== orgName.toLowerCase()) {
      return NextResponse.json({ 
        error: 'Organization mismatch' 
      }, { status: 403 });
    }

    // Create NextAuth session token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    const sessionMaxAge = 30 * 24 * 60 * 60; // 30 days
    
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
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token' 
      : 'next-auth.session-token';

    const response = NextResponse.json({ success: true });
    
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: sessionMaxAge,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Direct auth error:', error);
    return NextResponse.json(
      { error: 'Failed to create authentication session' }, 
      { status: 500 }
    );
  }
}