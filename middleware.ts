import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n';
import type { UserRole } from './lib/types/nhost';

/**
 * Middleware for Next.js App Router
 * 
 * Handles:
 * 1. Internationalization (next-intl)
 * 2. Authentication route protection
 * 3. Role-based access control (RBAC)
 */

/**
 * Route configuration with role requirements
 */
interface RouteConfig {
  path: string
  allowedRoles?: UserRole[]
  requireEmailVerified?: boolean
}

// Protected routes with role requirements
const PROTECTED_ROUTES: RouteConfig[] = [
  { path: '/dashboard', allowedRoles: ['user', 'admin'] },
  { path: '/settings', allowedRoles: ['user', 'admin'] },
  { path: '/organizations', allowedRoles: ['user', 'admin'] },
  { path: '/positions', allowedRoles: ['user', 'admin'] },
  { path: '/questionnaire', allowedRoles: ['user', 'admin'] },
  { path: '/analytics', allowedRoles: ['admin'] },
];

// Public routes that don't require authentication (route groups like (auth) aren't in the URL)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
];

/**
 * Decode JWT token to extract user claims
 * Note: This is a simplified decoder for middleware use only
 * Do NOT use for security-critical operations on the server
 */
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Try to read and parse the session cookie set by the Nhost JS client
 * The app stores session in a cookie named `nhostSession` (JSON, URI-encoded)
 */
function getSessionFromCookie(request: NextRequest): { accessToken?: string, refreshToken?: string } | null {
  const cookie = request.cookies.get('nhostSession');
  if (!cookie?.value) return null;
  try {
    const decoded = decodeURIComponent(cookie.value);
    const parsed = JSON.parse(decoded);
    // Accept either full session or minimal token bag
    const accessToken: string | undefined = parsed?.accessToken || parsed?.session?.accessToken;
    const refreshToken: string | undefined = parsed?.refreshToken || parsed?.session?.refreshToken;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

/**
 * Get user role from JWT token
 */
function getUserRole(accessToken: string | undefined): UserRole | null {
  if (!accessToken) return null;
  
  const decoded = decodeJWT(accessToken);
  if (!decoded) return null;
  
  // Nhost stores the default role in 'https://hasura.io/jwt/claims'
  const hasuraClaims = decoded['https://hasura.io/jwt/claims'];
  if (!hasuraClaims) return null;
  
  return (hasuraClaims['x-hasura-default-role'] as UserRole) || null;
}

/**
 * Check if user has required role for a route
 */
function hasRequiredRole(userRole: UserRole | null, allowedRoles?: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  
  return allowedRoles.includes(userRole);
}

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed'
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/(en|tr)/);
  const locale = localeMatch?.[1] || defaultLocale;
  
  // Remove locale prefix from pathname for route matching
  const pathnameWithoutLocale = pathname.replace(/^\/(en|tr)/, '') || '/';

  // Redirect root to dashboard for a meaningful landing
  if (pathnameWithoutLocale === '/') {
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Check if route requires authentication
  const matchedProtectedRoute = PROTECTED_ROUTES.find(route => 
    pathnameWithoutLocale.startsWith(route.path)
  );
  
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathnameWithoutLocale.startsWith(route)
  );

  // For protected routes, check authentication and roles
  if (matchedProtectedRoute) {
    // Attempt RBAC only when we can read a session cookie; otherwise let the client guard handle redirects
    const session = getSessionFromCookie(request);
    if (session?.accessToken) {
      const userRole = getUserRole(session.accessToken);
      const hasAccess = hasRequiredRole(userRole, matchedProtectedRoute.allowedRoles);
      if (!hasAccess) {
        // User doesn't have required role, redirect to dashboard with error
        const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
        dashboardUrl.searchParams.set('error', 'insufficient_permissions');
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  // For public auth routes, redirect authenticated users to dashboard
  if (isPublicRoute) {
    const session = getSessionFromCookie(request);
    if (session?.refreshToken) {
      // User is already authenticated, redirect to dashboard
      const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Apply internationalization middleware
  // Cast to any to avoid type mismatches between Next.js and next-intl type versions in edge runtime
  return intlMiddleware(request as any);
}

export const config = {
  // Match only internationalized pathnames
  // Exclude /api, /_next, /static, and public files from middleware
  matcher: ['/((?!api|_next|static|.*\\..*).*)']
};
