import { NavigationItem } from '@/lib/utils/navigation-filter';

/**
 * Navigation configuration with role-based access control
 * 
 * Role hierarchy:
 * - admin: Full access to all sections including analytics and system tools
 * - user: Organization user; access to all organization features (dashboard, organizations, positions, questionnaire, settings)
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'navigation.dashboard',
    icon: 'Home',
    href: '/dashboard',
    requiredRoles: ['user', 'admin'],
  },
  {
    id: 'organizations',
    label: 'navigation.organizations',
    icon: 'Building2',
    href: '/organizations',
    requiredRoles: ['user', 'admin'],
  },
  {
    id: 'positions',
    label: 'navigation.positions',
    icon: 'Briefcase',
    href: '/positions',
    requiredRoles: ['user', 'admin'],
  },
  {
    id: 'questionnaire',
    label: 'navigation.questionnaire',
    icon: 'ClipboardList',
    href: '/questionnaire',
    requiredRoles: ['user', 'admin'],
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
    requiredRoles: ['user', 'admin'],
  },
];
