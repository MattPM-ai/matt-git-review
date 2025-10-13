import { useEffect, useState, useRef } from 'react';
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
 * 
 * IMPORTANT: This hook uses primitive dependencies to prevent infinite re-renders.
 * The authTokenFromUrl is extracted outside useEffect to ensure stable reference.
 */
export function useQueryAuth(options: UseQueryAuthOptions = {}): QueryAuthState {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { requiredOrg, redirectOnFailure = false } = options;

  // Extract primitive value to prevent infinite re-renders from object reference changes
  const authTokenFromUrl = searchParams.get('_auth');

  const [authState, setAuthState] = useState<QueryAuthState>({
    isQueryAuthenticated: false,
    jwtToken: null,
    orgName: null,
    error: null,
    isLoading: true,
  });

  // Create stable reference to router to avoid including it in dependencies
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Consolidated authentication effect - processes URL params first, then sessionStorage
  useEffect(() => {
    // Priority 1: Process URL parameter if present
    if (authTokenFromUrl) {
      // Validate the JWT token
      const validation = validateGitHubOrgJWT(authTokenFromUrl);

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
          routerRef.current.push('/auth/error?error=InvalidToken');
        }
        return;
      }

      // Check org access if required
      if (requiredOrg && !hasOrgAccess(authTokenFromUrl, requiredOrg)) {
        const error = `Access denied to organization: ${requiredOrg}`;
        setAuthState({
          isQueryAuthenticated: false,
          jwtToken: null,
          orgName: validation.orgName || null,
          error,
          isLoading: false,
        });

        if (redirectOnFailure) {
          routerRef.current.push('/auth/error?error=AccessDenied');
        }
        return;
      }

      // Store token in sessionStorage for persistence
      if (typeof window !== 'undefined' && sessionStorage) {
        sessionStorage.setItem('query_jwt_token', authTokenFromUrl);
        sessionStorage.setItem('query_org_name', validation.orgName || '');
      }

      setAuthState({
        isQueryAuthenticated: true,
        jwtToken: authTokenFromUrl,
        orgName: validation.orgName || null,
        error: null,
        isLoading: false,
      });

      // Clean up URL by removing _auth parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('_auth');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    // Priority 2: Check sessionStorage only if no URL parameter
    if (typeof window !== 'undefined' && sessionStorage) {
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
    }

    // Priority 3: No authentication found
    setAuthState(prev => ({ ...prev, isLoading: false }));
  }, [authTokenFromUrl, requiredOrg, redirectOnFailure]); // Only primitive dependencies

  return authState;
}