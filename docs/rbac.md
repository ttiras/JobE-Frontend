# Role-Based Access Control (RBAC)

## Overview

JobE implements a comprehensive Role-Based Access Control (RBAC) system to secure routes and control feature access based on user roles.

## Role Hierarchy

### Roles

1. **user** (Organization User)
   - Access: Dashboard, Organizations, Positions, Questionnaire, Settings
   - Permissions: Full organization scope. Can view and manage organization resources allowed by Hasura policies; complete questionnaires; manage own profile.
   - Use case: HR staff, hiring managers, regular employees within their organization

2. **admin** (System Administrator)
   - Access: All routes including Analytics and system administration areas
   - Permissions: Full system access, view analytics, manage all users and billing/financials
   - Use case: Platform operators and system admins

## Implementation

### Middleware Protection

The main protection happens in `middleware.ts`:

```typescript
// Route configuration with role requirements
const PROTECTED_ROUTES: RouteConfig[] = [
   { path: '/dashboard', allowedRoles: ['user', 'admin'] },
   { path: '/settings', allowedRoles: ['user', 'admin'] },
   { path: '/organizations', allowedRoles: ['user', 'admin'] },
   { path: '/positions', allowedRoles: ['user', 'admin'] },
   { path: '/questionnaire', allowedRoles: ['user', 'admin'] },
   { path: '/analytics', allowedRoles: ['admin'] },
];
```

**How it works:**

1. **Authentication Check**: Verifies `nhostRefreshToken` cookie exists
2. **JWT Decoding**: Extracts user role from Nhost access token
3. **Role Verification**: Checks if user's role is in `allowedRoles`
4. **Redirect on Failure**: 
   - No token → `/auth/login?redirect=<original-path>`
   - Insufficient role → `/dashboard?error=insufficient_permissions`

### JWT Token Structure

Nhost stores roles in the JWT token under Hasura claims:

```json
{
  "https://hasura.io/jwt/claims": {
    "x-hasura-default-role": "user",
    "x-hasura-allowed-roles": ["user"],
    "x-hasura-user-id": "uuid..."
  }
}
```

The middleware extracts `x-hasura-default-role` to determine access.

### Navigation Filtering

The sidebar automatically hides navigation items based on user role.

**Implementation** (`components/layout/sidebar.tsx`):

```typescript
const { user } = useAuth();
const userRole = user?.defaultRole || 'user';
const visibleNavItems = filterNavigationByRole(navigationConfig, userRole);
```

**Result:**
- **user**: Sees Dashboard, Organizations, Positions, Questionnaire, Settings
- **admin**: Sees all navigation items including Analytics

### Utility Functions

**`lib/utils/navigation-filter.ts`** provides helper functions:

```typescript
// Filter navigation items by role
filterNavigationByRole(items, userRole)

// Check if user has access to a route
hasRouteAccess(route, userRole, navigationItems)

// Get all accessible routes for a user
getAccessibleRoutes(userRole, navigationItems)
```

## Configuration

### Adding New Protected Routes

1. **Update middleware.ts:**
   ```typescript
   const PROTECTED_ROUTES: RouteConfig[] = [
       // ... existing routes
       { path: '/new-feature', allowedRoles: ['user', 'admin'] },
   ];
   ```

2. **Update navigation config:**
   ```typescript
   // config/navigation.ts
   {
     id: 'new-feature',
     label: 'navigation.newFeature',
     icon: 'Icon',
     href: '/new-feature',
       requiredRoles: ['user', 'admin'],
   }
   ```

3. **Add translations:**
   ```json
   // messages/en.json
   {
     "navigation": {
       "newFeature": "New Feature"
     }
   }
   ```

### Changing Role Assignments

Roles are assigned during user registration in Nhost. To change the default:

**`lib/nhost/auth.ts`:**
```typescript
const response = await nhost.auth.signUpEmailPassword({
  email,
  password,
  options: {
    defaultRole: 'user', // Change this
    allowedRoles: ['user'], // And this
  },
})
```

**Note:** For security, role assignment should typically happen server-side or through admin interfaces, not during self-registration.

## Security Considerations

### Client-Side vs Server-Side

1. **Middleware (Edge)**: 
   - Runs on Vercel Edge
   - Decodes JWT for quick role check
   - **NOT cryptographically verified** (lightweight check only)
   - Purpose: UI/UX protection and redirects

2. **API Routes (Server)**:
   - Must verify JWT signature with Nhost public key
   - Use Nhost SDK for proper verification
   - Never trust client-provided role claims

3. **Database (Hasura)**:
   - Final authority on permissions
   - Row-level security based on JWT claims
   - Cannot be bypassed by client

### Best Practices

✅ **DO:**
- Use middleware for UI protection and UX
- Verify roles server-side for sensitive operations
- Rely on Hasura permissions for data access
- Test with different roles regularly

❌ **DON'T:**
- Trust client-side role checks for security
- Expose admin-only data in client components
- Skip server-side verification
- Hard-code role checks everywhere (use utilities)

## User Experience

### Insufficient Permissions

When a user tries to access a route they don't have permission for:

1. Middleware redirects to `/dashboard?error=insufficient_permissions`
2. Dashboard displays toast notification:
   ```
   Insufficient Permissions
   You do not have access to the requested page.
   ```
3. User sees only navigation items they have access to

### Direct URL Access

If a user bookmarks or shares a URL they shouldn't access:

1. Middleware intercepts the request
2. Checks authentication → redirects to login if needed
3. Checks role → redirects to dashboard with error if insufficient
4. User never sees the protected content

## Testing RBAC

### Manual Testing

1. **Create users with different roles:**
   ```bash
   # In Nhost console, manually update user roles
   # Make an admin
   UPDATE auth.users 
   SET default_role = 'admin', 
       roles = '{admin}' 
   WHERE email = 'admin@example.com';

   # Make a regular user
   UPDATE auth.users 
   SET default_role = 'user', 
       roles = '{user}' 
   WHERE email = 'user@example.com';
   ```

2. **Test each role:**
   - Login as `user` → should see Dashboard, Organizations, Positions, Questionnaire, Settings; NOT Analytics
   - Login as `admin` → should see everything including Analytics

3. **Test direct access:**
   - As `user`, navigate to `/en/analytics`
   - Should redirect to `/en/dashboard?error=insufficient_permissions`

### Automated Testing

E2E tests can verify RBAC (in `tests/e2e/rbac.spec.ts`):

```typescript
test('user cannot access admin routes', async ({ page }) => {
  // Login as user
  await page.goto('/en/auth/login')
  await page.fill('input[type="email"]', 'user@example.com')
  await page.fill('input[type="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Try to access analytics
  await page.goto('/en/analytics')
  
  // Should be redirected to dashboard
  await expect(page).toHaveURL(/\/en\/dashboard/)
  
  // Should see error toast
  await expect(page.locator('text=Insufficient Permissions')).toBeVisible()
})
```

## Troubleshooting

### Navigation item shows but route is blocked

**Cause:** Mismatch between `navigationConfig` and `PROTECTED_ROUTES`

**Fix:** Ensure both arrays have matching roles:
```typescript
// config/navigation.ts
{ path: '/organizations', requiredRoles: ['user', 'admin'] }

// middleware.ts  
{ path: '/organizations', allowedRoles: ['user', 'admin'] }
```

### Role changes not taking effect

**Cause:** JWT token cached with old role

**Fix:**
1. Sign out and sign back in
2. Or wait for token refresh (default: 15 minutes)
3. Or force refresh: `nhost.refreshSession()`

### Users can access routes they shouldn't

**Cause:** Middleware config not matching actual routes

**Fix:** Check middleware matcher in `middleware.ts`:
```typescript
export const config = {
  matcher: ['/((?!api|_next|static|.*\\..*).*)']
};
```

### JWT decode fails

**Cause:** Invalid or missing access token

**Fix:** 
1. Check cookie is being set: `nhostAccessToken`
2. Verify Nhost authentication is working
3. Check browser console for errors
4. Try logout and login again

## Future Enhancements

### Planned Features

1. **Fine-grained Permissions**
   - Add permission system beyond roles
   - Example: `can_edit_positions`, `can_delete_users`

2. **Role Management UI**
   - Admin interface to change user roles
   - Audit log of role changes

3. **Multi-role Support**
   - Allow users to have multiple active roles
   - Switch between roles dynamically

4. **Resource-based Access**
   - Check ownership before allowing edit/delete
   - Example: Users can only edit their own applications

## Related Files

- `middleware.ts` - Main RBAC enforcement
- `lib/types/user.ts` - Role type definitions
- `lib/types/nhost.ts` - Nhost user types with roles
- `config/navigation.ts` - Navigation with role requirements
- `lib/utils/navigation-filter.ts` - Role-based filtering utilities
- `components/layout/sidebar.tsx` - Navigation rendering with role filtering
- `app/[locale]/(dashboard)/dashboard/page.tsx` - Permission error handling
