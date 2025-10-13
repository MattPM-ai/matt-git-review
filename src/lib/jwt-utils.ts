interface JWTPayload {
  type?: string;
  username?: string;
  sub?: string;
  name?: string;
  avatar_url?: string;
  html_url?: string;
  [key: string]: unknown;
}

interface ValidatedJWT {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Decode JWT token without verification (client-side only)
 * Note: This is for reading the payload, not for security validation
 */
export function decodeJWTPayload(token: string): ValidatedJWT {
  try {
    // Split the JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT format' };
    }

    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    
    return { isValid: true, payload };
  } catch {
    return { isValid: false, error: 'Failed to decode JWT token' };
  }
}

/**
 * Validate if JWT token is for GitHub org access
 */
export function validateGitHubOrgJWT(token: string): ValidatedJWT & { orgName?: string } {
  const decoded = decodeJWTPayload(token);
  
  if (!decoded.isValid || !decoded.payload) {
    return decoded;
  }

  const { payload } = decoded;

  // Check if token has expired
  if (payload.exp && typeof payload.exp === 'number') {
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      return {
        isValid: false,
        error: 'Token has expired'
      };
    }
  }

  // Check if token type is 'github_org'
  if (payload.type !== 'github_org') {
    return { 
      isValid: false, 
      error: 'Token type must be github_org' 
    };
  }

  // Check if username (org name) is present
  if (!payload.username) {
    return { 
      isValid: false, 
      error: 'Token must contain organization name in username field' 
    };
  }

  return {
    isValid: true,
    payload,
    orgName: payload.username
  };
}

/**
 * Check if user has access to specific org
 */
export function hasOrgAccess(token: string, requiredOrg: string): boolean {
  const validation = validateGitHubOrgJWT(token);
  
  if (!validation.isValid || !validation.orgName) {
    return false;
  }

  return validation.orgName.toLowerCase() === requiredOrg.toLowerCase();
}