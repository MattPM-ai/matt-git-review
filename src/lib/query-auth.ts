import { NextRequest } from 'next/server';
import { validateGitHubOrgJWT, hasOrgAccess } from './jwt-utils';

interface QueryAuthResult {
  isAuthenticated: boolean;
  jwtToken?: string;
  orgName?: string;
  error?: string;
}

/**
 * Extract and validate JWT token from query parameters
 */
export function extractQueryAuth(request: NextRequest): QueryAuthResult {
  const url = new URL(request.url);
  const authToken = url.searchParams.get('_auth');

  if (!authToken) {
    return { isAuthenticated: false };
  }

  // Validate the JWT token
  const validation = validateGitHubOrgJWT(authToken);
  
  if (!validation.isValid) {
    return { 
      isAuthenticated: false, 
      error: validation.error || 'Invalid authentication token'
    };
  }

  return {
    isAuthenticated: true,
    jwtToken: authToken,
    orgName: validation.orgName
  };
}

/**
 * Check if authenticated user has access to requested org
 */
export function validateOrgAccess(jwtToken: string, requestedOrg: string): boolean {
  return hasOrgAccess(jwtToken, requestedOrg);
}

/**
 * Extract org name from URL path
 */
export function extractOrgFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/org\/([^\/]+)/);
  return match ? match[1] : null;
}