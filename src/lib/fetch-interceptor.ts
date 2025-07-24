import { signOut } from 'next-auth/react';

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Check for JWT token in Authorization header
  const authHeader = init?.headers && 'Authorization' in init.headers 
    ? (init.headers as Record<string, string>)['Authorization'] 
    : null;
    
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (checkTokenExpiration(token)) {
      // Handle expired token before making the request
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isDirectAuth = document.cookie.includes('matt-direct-jwt');
        
        if (isDirectAuth) {
          const clearCookies = () => {
            document.cookie = 'matt-direct-jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'matt-direct-jwt-org=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          };
          
          clearCookies();
          window.location.href = '/auth/error?error=TokenExpired';
        } else {
          await signOut({ 
            callbackUrl: `/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`,
            redirect: true 
          });
        }
      }
      
      throw new UnauthorizedError('JWT token has expired');
    }
  }

  const response = await fetch(input, init);

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isDirectAuth = document.cookie.includes('matt-direct-jwt');
      
      if (isDirectAuth) {
        const clearCookies = () => {
          document.cookie = 'matt-direct-jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'matt-direct-jwt-org=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        };
        
        clearCookies();
        window.location.href = '/auth/error?error=TokenExpired';
      } else {
        await signOut({ 
          callbackUrl: `/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`,
          redirect: true 
        });
      }
    }
    
    throw new UnauthorizedError('JWT token has expired or is invalid');
  }

  return response;
}

export function checkTokenExpiration(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    
    if (!exp) {
      return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return currentTime >= exp;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}