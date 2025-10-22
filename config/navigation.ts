import { NavigationItem } from '@/lib/utils/navigation-filter';

/**
 * Navigation configuration with role-based access control
 * 
 * Role hierarchy:
 * - Admin: Full access to all sections
 * - HR Manager: All except Settings
 * - Viewer: Limited to Dashboard, Organizations, Positions, Analytics
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'navigation.dashboard',
    icon: 'Home',
    href: '/dashboard',
    requiredRoles: ['Admin', 'HR Manager', 'Viewer'],
  },
  {
    id: 'organizations',
    label: 'navigation.organizations',
    icon: 'Building2',
    href: '/organizations',
    requiredRoles: ['Admin', 'HR Manager', 'Viewer'],
  },
  {
    id: 'positions',
    label: 'navigation.positions',
    icon: 'Briefcase',
    href: '/positions',
    requiredRoles: ['Admin', 'HR Manager', 'Viewer'],
  },
  {
    id: 'questionnaire',
    label: 'navigation.questionnaire',
    icon: 'ClipboardList',
    href: '/questionnaire',
    requiredRoles: ['Admin', 'HR Manager'],
  },
  {
    id: 'analytics',
    label: 'navigation.analytics',
    icon: 'BarChart3',
    href: '/analytics',
    requiredRoles: ['Admin', 'HR Manager', 'Viewer'],
  },
  {
    id: 'settings',
    label: 'navigation.settings',
    icon: 'Settings',
    href: '/settings',
    requiredRoles: ['Admin'],
  },
];
