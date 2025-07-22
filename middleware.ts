import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractQueryAuth, extractOrgFromPath, validateOrgAccess } from '@/lib/query-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /org routes
  if (pathname.startsWith('/org/')) {
    const orgName = extractOrgFromPath(pathname);
    
    if (orgName) {
      const queryAuth = extractQueryAuth(request);
      
      if (queryAuth.isAuthenticated && queryAuth.jwtToken) {
        // Validate org access
        if (!validateOrgAccess(queryAuth.jwtToken, orgName)) {
          return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', request.url));
        }

        // Create a response with the JWT token in a cookie for the session
        const response = NextResponse.next();
        
        // Set a temporary cookie for the client to pick up
        response.cookies.set('temp_jwt_token', queryAuth.jwtToken, {
          httpOnly: false, // Client needs to read this
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 300, // 5 minutes, just long enough for client to process
          path: '/',
        });

        response.cookies.set('temp_org_name', orgName, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 300,
          path: '/',
        });

        return response;
      } else if (queryAuth.error) {
        return NextResponse.redirect(new URL(`/auth/error?error=InvalidToken&message=${encodeURIComponent(queryAuth.error)}`, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};