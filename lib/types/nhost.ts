/**
 * Nhost type definitions for JobE application
 * Extends base Nhost types with application-specific properties
 */

import type { User as NhostUser, Session as NhostSession } from '@nhost/nhost-js/auth'

/**
 * User roles in the application
 * Maps to Hasura allowed roles configuration
 */
export type UserRole = 'user' | 'recruiter' | 'admin'

/**
 * Application User type
 * Re-export from Nhost with type assertion for roles
 */
export type User = NhostUser & {
  defaultRole: UserRole
  roles: UserRole[]
}

/**
 * Application Session type
 * Re-export from Nhost
 */
export type Session = NhostSession

/**
 * Authentication state used throughout the application
 */
export interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  error: Error | null
}

/**
 * Authentication error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_EMAIL = 'INVALID_EMAIL',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Authentication error with type and message
 */
export interface AuthError extends Error {
  type: AuthErrorType
  message: string
  originalError?: Error
}

/**
 * File upload metadata for Nhost Storage
 */
export interface FileMetadata {
  id: string
  name: string
  size: number
  mimeType: string
  bucketId: string
  etag?: string
  createdAt: string
  updatedAt: string
  isUploaded: boolean
  uploadedByUserId: string
}

/**
 * Storage error types
 */
export enum StorageErrorType {
  FILE_TOO_LARGE = 'file-too-large',
  INVALID_FILE_TYPE = 'invalid-file-type',
  UPLOAD_FAILED = 'upload-failed',
  DOWNLOAD_FAILED = 'download-failed',
  VIRUS_DETECTED = 'virus-detected',
  NETWORK_ERROR = 'network-error',
  UNAUTHORIZED = 'unauthorized',
  UNKNOWN = 'unknown',
}

/**
 * Storage operation error
 */
export interface StorageError extends Error {
  type: StorageErrorType
  message: string
  originalError?: Error
}
