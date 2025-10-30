import { UserRole } from '@/lib/types/user';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  requiredRoles: UserRole[];
  children?: NavigationItem[];
}

/**
 * Filter navigation items based on user role
 */
export function filterNavigationByRole(
  items: NavigationItem[],
  userRole: UserRole
): NavigationItem[] {
  return items.filter(item => item.requiredRoles.includes(userRole));
}

/**
 * Check if user has access to a specific route
 */
export function hasRouteAccess(
  route: string,
  userRole: UserRole,
  navigationItems: NavigationItem[]
): boolean {
  const item = navigationItems.find(nav => nav.href === route);
  if (!item) return true; // Allow access to routes not in navigation config
  return item.requiredRoles.includes(userRole);
}

/**
 * Get accessible routes for a user role
 */
export function getAccessibleRoutes(
  userRole: UserRole,
  navigationItems: NavigationItem[]
): string[] {
  return filterNavigationByRole(navigationItems, userRole).map(item => item.href);
}
