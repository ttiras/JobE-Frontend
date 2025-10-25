/**
 * User role types matching Nhost/Hasura roles
 * 
 * Role hierarchy:
 * - user: Organization-scoped user; can access all organization features
 * - admin: System administrator; full system access including analytics and user management
 */
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

