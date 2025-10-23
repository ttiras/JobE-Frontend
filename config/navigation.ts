import { NavigationItem } from '@/lib/utils/navigation-filter';

/**
 * Navigation configuration with role-based access control
 * 
 * Role hierarchy:
 * - admin: Full access to all sections including analytics
 * - recruiter: Can manage organizations, positions, questionnaires
 * - user: Basic access to dashboard, questionnaire, and settings
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'navigation.dashboard',
    icon: 'Home',
    href: '/dashboard',
    requiredRoles: ['user', 'recruiter', 'admin'],
  },
  {
    id: 'organizations',
    label: 'navigation.organizations',
    icon: 'Building2',
    href: '/organizations',
    requiredRoles: ['recruiter', 'admin'],
  },
  {
    id: 'positions',
    label: 'navigation.positions',
    icon: 'Briefcase',
    href: '/positions',
    requiredRoles: ['recruiter', 'admin'],
  },
  {
    id: 'questionnaire',
    label: 'navigation.questionnaire',
    icon: 'ClipboardList',
    href: '/questionnaire',
    requiredRoles: ['user', 'recruiter', 'admin'],
  },
  {
    id: 'analytics',
    label: 'navigation.analytics',
    icon: 'BarChart3',
    href: '/analytics',
    requiredRoles: ['admin'],
  },
  {
    id: 'settings',
    label: 'navigation.settings',
    icon: 'Settings',
    href: '/settings',
    requiredRoles: ['user', 'recruiter', 'admin'],
  },
];
