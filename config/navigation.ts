import { NavigationItem } from '@/lib/utils/navigation-filter';

/**
 * Navigation configuration with role-based access control
 * 
 * Role hierarchy:
 * - admin: Full access to all sections including analytics and system tools
 * - user: Organization user; access to organization features (dashboard, positions, questionnaire, settings)
 * 
 * Note: These paths are org-relative. The sidebar will prepend /{locale}/dashboard/{orgId} to each href.
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'navigation.dashboard',
    icon: 'Home',
    href: '',
    requiredRoles: ['user', 'admin'],
  },
  // Org Structure Group - using 'group' property to add spacing
  {
    id: 'departments',
    label: 'navigation.departments',
    icon: 'FolderKanban',
    href: '/org-structure/departments',
    requiredRoles: ['user', 'admin'],
    group: 'orgStructure', // Visual grouping
  },
  {
    id: 'positions',
    label: 'navigation.positions',
    icon: 'Briefcase',
    href: '/org-structure/positions',
    requiredRoles: ['user', 'admin'],
    group: 'orgStructure',
  },
  {
    id: 'organizationChart',
    label: 'navigation.organizationChart',
    icon: 'Network',
    href: '/org-structure/hierarchy',
    requiredRoles: ['user', 'admin'],
    group: 'orgStructure',
  },
  // Evaluation Group
  {
    id: 'questionnaire',
    label: 'navigation.questionnaire',
    icon: 'ClipboardList',
    href: '/questionnaire',
    requiredRoles: ['user', 'admin'],
    group: 'evaluation',
  },
  // Admin Group
  {
    id: 'analytics',
    label: 'navigation.analytics',
    icon: 'BarChart3',
    href: '/analytics',
    requiredRoles: ['admin'],
    group: 'admin',
  },
  // Settings Group
  {
    id: 'settings',
    label: 'navigation.settings',
    icon: 'Settings',
    href: '/settings',
    requiredRoles: ['user', 'admin'],
    group: 'settings',
  },
];
