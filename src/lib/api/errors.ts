/**
 * API ERROR CLASSES
 * 
 * Centralized error definitions for all API client operations.
 * Provides typed error classes with additional context for debugging and error handling.
 */

/**
 * Base API Error Class
 * 
 * Thrown when any API request fails with an HTTP error status.
 * Includes the status code and endpoint for debugging.
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public responseBody?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * No Activity Error
 * 
 * Thrown when a request for activity data returns no results.
 * This is a special case that should be handled differently from other errors.
 */
export class NoActivityError extends Error {
  constructor(message: string = 'No activity found for this period') {
    super(message);
    this.name = 'NoActivityError';
  }
}

/**
 * Authentication Error
 * 
 * Thrown when JWT token is missing, invalid, or expired.
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Configuration Error
 * 
 * Thrown when required environment variables or configuration is missing.
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

