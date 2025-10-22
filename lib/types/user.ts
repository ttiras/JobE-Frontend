export type UserRole = 'Admin' | 'HR Manager' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}
