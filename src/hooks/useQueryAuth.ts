import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { validateGitHubOrgJWT, hasOrgAccess } from '@/lib/jwt-utils';

interface QueryAuthState {
  isQueryAuthenticated: boolean;
  jwtToken: string | null;
  orgName: string | null;
  error: string | null;
  isLoading: boolean;
}

interface UseQueryAuthOptions {
  requiredOrg?: string;
  redirectOnFailure?: boolean;
}

/**
 * Hook to handle authentication via query parameters
 */
export function useQueryAuth(options: UseQueryAuthOptions = {}): QueryAuthState {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requiredOrg, redirectOnFailure = false } = options;

  const [authState, setAuthState] = useState<QueryAuthState>({
    isQueryAuthenticated: false,
    jwtToken: null,
    orgName: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    const authToken = searchParams.get('_auth');

    if (!authToken) {
      setAuthState({
        isQueryAuthenticated: false,
        jwtToken: null,
        orgName: null,
        error: null,
        isLoading: false,
      });
      return;
    }

    // Validate the JWT token
    const validation = validateGitHubOrgJWT(authToken);

    if (!validation.isValid) {
      const error = validation.error || 'Invalid authentication token';
      setAuthState({
        isQueryAuthenticated: false,
        jwtToken: null,
        orgName: null,
        error,
        isLoading: false,
      });

      if (redirectOnFailure) {
        router.push('/auth/error?error=InvalidToken');
      }
      return;
    }

    // Check org access if required
    if (requiredOrg && !hasOrgAccess(authToken, requiredOrg)) {
      const error = `Access denied to organization: ${requiredOrg}`;
      setAuthState({
        isQueryAuthenticated: false,
        jwtToken: null,
        orgName: validation.orgName || null,
        error,
        isLoading: false,
      });

      if (redirectOnFailure) {
        router.push('/auth/error?error=AccessDenied');
      }
      return;
    }

    // Store token in sessionStorage for persistence
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('query_jwt_token', authToken);
      sessionStorage.setItem('query_org_name', validation.orgName || '');
    }

    setAuthState({
      isQueryAuthenticated: true,
      jwtToken: authToken,
      orgName: validation.orgName || null,
      error: null,
      isLoading: false,
    });

    // Clean up URL by removing _auth parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('_auth');
    window.history.replaceState({}, '', url.toString());
  }, [searchParams, requiredOrg, redirectOnFailure, router]);

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !searchParams.get('_auth')) {
      const storedToken = sessionStorage.getItem('query_jwt_token');
      const storedOrgName = sessionStorage.getItem('query_org_name');

      if (storedToken) {
        const validation = validateGitHubOrgJWT(storedToken);
        
        if (validation.isValid) {
          // Check org access if required
          if (requiredOrg && !hasOrgAccess(storedToken, requiredOrg)) {
            // Clear invalid session
            sessionStorage.removeItem('query_jwt_token');
            sessionStorage.removeItem('query_org_name');
            
            setAuthState({
              isQueryAuthenticated: false,
              jwtToken: null,
              orgName: null,
              error: `Access denied to organization: ${requiredOrg}`,
              isLoading: false,
            });
            return;
          }

          setAuthState({
            isQueryAuthenticated: true,
            jwtToken: storedToken,
            orgName: storedOrgName,
            error: null,
            isLoading: false,
          });
          return;
        } else {
          // Clear invalid session
          sessionStorage.removeItem('query_jwt_token');
          sessionStorage.removeItem('query_org_name');
        }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [requiredOrg, searchParams]);

  return authState;
}