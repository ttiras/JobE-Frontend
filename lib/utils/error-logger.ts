/**
 * Generates a unique error ID for tracking
 */
export function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 7);
  return `ERR-${timestamp}-${randomPart}`.toUpperCase();
}

export interface ErrorLogEntry {
  id: string;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  stack?: string;
}

/**
 * Logs an error with a unique ID and returns the ID
 */
export function logError(
  error: Error | string,
  context?: Record<string, unknown>
): string {
  const errorId = generateErrorId();
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;

  const logEntry: ErrorLogEntry = {
    id: errorId,
    message,
    timestamp: new Date(),
    context,
    stack,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error Logger]', logEntry);
  }

  // In production, this would send to a logging service
  // e.g., Sentry, LogRocket, CloudWatch, etc.

  return errorId;
}

/**
 * Logs a warning with context
 */
export function logWarning(
  message: string,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Warning]', message, context);
  }
}

/**
 * Logs info for debugging
 */
export function logInfo(
  message: string,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.info('[Info]', message, context);
  }
}
