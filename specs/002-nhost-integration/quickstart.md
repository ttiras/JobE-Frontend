# Quickstart: Nhost Integration

**Date**: 2025-10-22  
**Feature**: 002-nhost-integration

## Overview

Quick reference guide for developers working with Nhost integration in the JobE frontend. This guide covers setup, common patterns, and troubleshooting.

---

## Prerequisites

- Node.js 18+ and pnpm installed
- Nhost CLI installed: `npm install -g nhost`
- Access to Nhost project (local or staging)
- Environment variables configured

---

## Initial Setup

### 1. Install Dependencies

```bash
cd /Users/tacettintiras/Documents/JobE-Frontend
pnpm install @nhost/nextjs @nhost/nhost-js graphql
pnpm install -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

### 2. Configure Environment Variables

Create `.env.local`:

```bash
# Local Development
NEXT_PUBLIC_NHOST_SUBDOMAIN=local
NEXT_PUBLIC_NHOST_REGION=

# For local Nhost instance
NHOST_ADMIN_SECRET=nhost-admin-secret
```

For staging (`.env.staging`):

```bash
NEXT_PUBLIC_NHOST_SUBDOMAIN=bgkrpcjhawoxjnfxufdf
NEXT_PUBLIC_NHOST_REGION=eu-central-1
```

### 3. Start Local Nhost Backend (Optional)

```bash
# Initialize Nhost in project
nhost init

# Start local Nhost services (PostgreSQL, Hasura, Auth, Storage)
nhost up

# View Hasura console
nhost console
```

### 4. Run GraphQL Code Generation

```bash
# Generate TypeScript types from GraphQL schema
pnpm graphql-codegen

# Watch mode (regenerate on schema changes)
pnpm graphql-codegen --watch
```

---

## Common Patterns

### Authentication

#### Sign Up

```typescript
import { useSignUpEmailPassword } from '@nhost/nextjs';

export function RegisterForm() {
  const { signUpEmailPassword, isLoading, error } = useSignUpEmailPassword();
  
  const handleSubmit = async (email: string, password: string) => {
    const result = await signUpEmailPassword(email, password, {
      displayName: 'User Name',
      locale: 'en',
    });
    
    if (result.error) {
      console.error('Registration failed:', result.error);
      return;
    }
    
    // User created, redirect to email verification notice
  };
  
  return (/* form JSX */);
}
```

#### Sign In

```typescript
import { useSignInEmailPassword } from '@nhost/nextjs';

export function LoginForm() {
  const { signInEmailPassword, isLoading, error } = useSignInEmailPassword();
  
  const handleSubmit = async (email: string, password: string) => {
    const result = await signInEmailPassword(email, password);
    
    if (result.error) {
      console.error('Login failed:', result.error);
      return;
    }
    
    // Success - redirect to dashboard
  };
  
  return (/* form JSX */);
}
```

#### Sign Out

```typescript
import { useSignOut } from '@nhost/nextjs';

export function LogoutButton() {
  const { signOut } = useSignOut();
  
  return <button onClick={signOut}>Log out</button>;
}
```

#### Check Authentication Status

```typescript
import { useAuthenticated, useUserData } from '@nhost/nextjs';

export function ProfilePage() {
  const isAuthenticated = useAuthenticated();
  const user = useUserData();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user?.displayName}!</div>;
}
```

---

### File Upload

#### Upload File

```typescript
import { useFileUpload } from '@nhost/nextjs';

export function FileUploader() {
  const { upload, isUploading, progress } = useFileUpload();
  
  const handleFileUpload = async (file: File) => {
    try {
      const result = await upload({
        file,
        bucketId: 'resumes',
        name: file.name,
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      console.log('File uploaded:', result.id);
      return result.id;
    } catch (error) {
      console.error('Upload failed:', error);
      // Implement retry logic here
    }
  };
  
  return (
    <div>
      {isUploading && <div>Upload progress: {progress}%</div>}
      <input type="file" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
    </div>
  );
}
```

#### Download File

```typescript
import { useGetPresignedUrl } from '@nhost/nextjs';

export function FileDownloader({ fileId }: { fileId: string }) {
  const { getPresignedUrl } = useGetPresignedUrl();
  
  const handleDownload = async () => {
    const { presignedUrl, error } = await getPresignedUrl({ fileId });
    
    if (error || !presignedUrl) {
      console.error('Failed to get download URL');
      return;
    }
    
    // Download file
    window.open(presignedUrl.url, '_blank');
  };
  
  return <button onClick={handleDownload}>Download</button>;
}
```

#### Delete File

```typescript
import { useFileUpload } from '@nhost/nextjs';

export function FileDeleter({ fileId }: { fileId: string }) {
  const { remove } = useFileUpload();
  
  const handleDelete = async () => {
    const { error } = await remove({ fileId });
    
    if (error) {
      console.error('Failed to delete file:', error);
      return;
    }
    
    console.log('File deleted successfully');
  };
  
  return <button onClick={handleDelete}>Delete</button>;
}
```

---

### GraphQL Queries

#### Fetch Organizations

```typescript
import { useOrganizationsQuery } from '@/lib/nhost/graphql/generated/graphql';

export function OrganizationsList() {
  const { data, loading, error } = useOrganizationsQuery({
    variables: {
      limit: 10,
      offset: 0,
      orderBy: [{ createdAt: 'DESC' }],
    },
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data?.organizations.map((org) => (
        <li key={org.id}>{org.name}</li>
      ))}
    </ul>
  );
}
```

#### Create Organization

```typescript
import { useCreateOrganizationMutation } from '@/lib/nhost/graphql/generated/graphql';

export function CreateOrganizationForm() {
  const [createOrganization, { loading, error }] = useCreateOrganizationMutation();
  
  const handleSubmit = async (name: string, description: string) => {
    try {
      const result = await createOrganization({
        variables: {
          name,
          description,
        },
      });
      
      console.log('Organization created:', result.data?.createOrganization);
    } catch (err) {
      console.error('Failed to create organization:', err);
    }
  };
  
  return (/* form JSX */);
}
```

#### GraphQL Subscription (Real-time)

```typescript
import { useApplicationsByPositionSubscription } from '@/lib/nhost/graphql/generated/graphql';

export function ApplicationsLiveList({ positionId }: { positionId: string }) {
  const { data, loading, error } = useApplicationsByPositionSubscription({
    variables: { positionId },
  });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <ul>
      {data?.applicationsByPosition.map((app) => (
        <li key={app.id}>{app.user.displayName} - {app.status}</li>
      ))}
    </ul>
  );
}
```

---

### Middleware (Route Protection)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('nhostSession')?.value;
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/register');
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect to dashboard if accessing auth route with active session
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
```

---

### Nhost Provider Setup

```typescript
// app/layout.tsx
import { NhostProvider } from '@nhost/nextjs';
import { NhostClient } from '@nhost/nhost-js';

const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!,
  region: process.env.NEXT_PUBLIC_NHOST_REGION,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <NhostProvider nhost={nhost}>
          {children}
        </NhostProvider>
      </body>
    </html>
  );
}
```

---

## Error Handling

### Authentication Errors

```typescript
import { useSignInEmailPassword } from '@nhost/nextjs';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const { signInEmailPassword, error } = useSignInEmailPassword();
  const t = useTranslations('auth.errors');
  
  const getErrorMessage = (error: any) => {
    switch (error?.message) {
      case 'invalid-email-password':
        return t('invalid_credentials');
      case 'email-not-verified':
        return t('email_not_verified');
      case 'user-disabled':
        return t('account_disabled');
      default:
        return t('unknown_error');
    }
  };
  
  return (
    <div>
      {error && <div className="text-red-500">{getErrorMessage(error)}</div>}
      {/* form fields */}
    </div>
  );
}
```

### GraphQL Errors

```typescript
import { useOrganizationsQuery } from '@/lib/nhost/graphql/generated/graphql';

export function OrganizationsList() {
  const { data, error } = useOrganizationsQuery();
  
  if (error) {
    // GraphQL errors
    if (error.graphQLErrors.length > 0) {
      const gqlError = error.graphQLErrors[0];
      
      if (gqlError.extensions?.code === 'access-denied') {
        return <div>You don't have permission to view organizations</div>;
      }
    }
    
    // Network errors
    if (error.networkError) {
      return <div>Network error. Please check your connection.</div>;
    }
    
    return <div>An error occurred</div>;
  }
  
  // Render data
}
```

---

## Testing

### Unit Test with Mocked Nhost

```typescript
// __tests__/login-form.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from '@/components/auth/login-form';

jest.mock('@nhost/nextjs', () => ({
  useSignInEmailPassword: jest.fn(),
}));

describe('LoginForm', () => {
  it('should call signIn with email and password', async () => {
    const mockSignIn = jest.fn();
    const { useSignInEmailPassword } = require('@nhost/nextjs');
    
    useSignInEmailPassword.mockReturnValue({
      signInEmailPassword: mockSignIn,
      isLoading: false,
      error: null,
    });
    
    render(<LoginForm />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
```

---

## Troubleshooting

### Issue: "Nhost client not initialized"

**Solution**: Ensure `NhostProvider` wraps your app in `layout.tsx`

### Issue: GraphQL queries return empty data

**Solution**: Check Hasura permissions - user role may not have read access

### Issue: File upload fails with "Invalid bucket"

**Solution**: Create storage bucket in Nhost console: Storage > Buckets > Create

### Issue: Authentication redirects in loop

**Solution**: Check middleware logic - ensure auth routes and protected routes don't overlap

### Issue: TypeScript errors on generated GraphQL types

**Solution**: Run `pnpm graphql-codegen` to regenerate types after schema changes

---

## Useful Commands

```bash
# Start local Nhost
nhost up

# Stop local Nhost
nhost down

# View Hasura console
nhost console

# Apply database migrations
nhost migration apply

# Create new migration
nhost migration create <name>

# Generate GraphQL types
pnpm graphql-codegen

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Run E2E tests
pnpm playwright test
```

---

## Resources

- [Nhost Documentation](https://docs.nhost.io)
- [Nhost Next.js Quickstart](https://docs.nhost.io/platform/quickstarts/nextjs)
- [Hasura GraphQL Docs](https://hasura.io/docs/latest/index/)
- [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)

---

## Next Steps

1. Implement authentication components following TDD
2. Create file upload components with retry logic
3. Develop GraphQL queries and mutations
4. Set up middleware for route protection
5. Configure i18n messages for errors and UI text
6. Write comprehensive tests

See `tasks.md` for detailed implementation tasks.
