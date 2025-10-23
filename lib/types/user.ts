/**
 * User role types matching Nhost/Hasura roles
 * 
 * Role hierarchy:
 * - user: Basic authenticated user
 * - recruiter: Can manage organizations, positions, and questionnaires
 * - admin: Full system access including analytics
 */
export type UserRole = 'user' | 'recruiter' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

