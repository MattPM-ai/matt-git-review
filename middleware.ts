import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractOrgFromPath } from '@/lib/query-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle /org routes
  if (pathname.startsWith('/org/')) {
    const orgName = extractOrgFromPath(pathname);
    const url = new URL(request.url);
    const subscriptionId = url.searchParams.get('_auth');
    
    if (orgName && subscriptionId) {
      // For subscription ID auth, we just pass through and let the client handle token exchange
      // The QueryAuthHandler component will handle the subscription ID to JWT token exchange
      const response = NextResponse.next();
      
      // Set a temporary cookie to indicate we have a subscription auth attempt
      response.cookies.set('temp_subscription_id', subscriptionId, {
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