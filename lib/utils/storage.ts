import { Organization } from '@/lib/types/organization';

const STORAGE_KEYS = {
  ORGANIZATION: 'jobe_current_organization',
  SIDEBAR_COLLAPSED: 'jobe_sidebar_collapsed',
  THEME: 'jobe_theme',
  LOCALE: 'jobe_locale',
} as const;

// Organization storage
export function getStoredOrganization(): Organization | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ORGANIZATION);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredOrganization(org: Organization): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(org));
  } catch (error) {
    console.error('Failed to store organization:', error);
  }
}

export function removeStoredOrganization(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.ORGANIZATION);
}

// Sidebar state storage
export function getSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    return stored === 'true';
  } catch {
    return false;
  }
}

export function setSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(collapsed));
  } catch (error) {
    console.error('Failed to store sidebar state:', error);
  }
}
