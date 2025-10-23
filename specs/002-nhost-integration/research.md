# Research: Nhost Integration

**Date**: 2025-10-22  
**Feature**: 002-nhost-integration

## Overview

Research findings for integrating Nhost as the backend-as-a-service platform for authentication, storage, and PostgreSQL database with GraphQL API in a Next.js 15 application.

## Technology Decisions

### 1. Nhost SDK Selection

**Decision**: Use `@nhost/nextjs` and `@nhost/nhost-js`

**Rationale**:
- Official Nhost SDK with Next.js-specific optimizations
- Provides React hooks for authentication, storage, and GraphQL
- Server-side and client-side rendering support
- Built-in TypeScript support
- Handles session management and token refresh automatically
- Integrates with Next.js middleware for route protection

**Alternatives Considered**:
- `@nhost/react` - Generic React SDK, lacks Next.js-specific features
- Custom implementation - Rejected due to unnecessary complexity and maintenance burden
- Supabase - Different BaaS provider, Nhost already deployed and configured

**References**:
- https://docs.nhost.io/platform/quickstarts/nextjs
- https://www.npmjs.com/package/@nhost/nextjs

---

### 2. GraphQL Client and Code Generation

**Decision**: Use GraphQL with `graphql-codegen` for TypeScript type generation

**Rationale**:
- Nhost provides Hasura GraphQL Engine out of the box
- Type-safe queries and mutations with auto-generated TypeScript types
- Better developer experience with IDE autocomplete
- Reduces runtime errors by catching type mismatches at compile time
- Standard approach for GraphQL + TypeScript projects

**Alternatives Considered**:
- Apollo Client - Overkill for Nhost which has simpler built-in client
- Manual typing - Error-prone and harder to maintain
- No code generation - Loses type safety benefits

**Configuration**:
```yaml
# codegen.yml
schema: ${NHOST_GRAPHQL_URL}
documents: 'lib/nhost/graphql/**/*.ts'
generates:
  lib/nhost/graphql/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
```

**References**:
- https://the-guild.dev/graphql/codegen
- https://docs.nhost.io/graphql

---

### 3. Authentication Flow Pattern

**Decision**: Use Nhost's built-in authentication with custom UI components

**Rationale**:
- Nhost handles all security aspects (password hashing, session tokens, JWT)
- Provides hooks: `useSignUpEmailPassword`, `useSignInEmailPassword`, `useSignOut`
- Custom UI components for brand consistency and UX control
- Supports email verification, password reset out of the box
- Rate limiting and security features built-in

**Flow**:
1. User submits credentials via custom form component
2. Component calls Nhost hook (e.g., `useSignInEmailPassword`)
3. Nhost validates credentials and creates session
4. Session token stored in httpOnly cookie (secure by default)
5. Middleware checks authentication on protected routes
6. Auto-refresh tokens before expiry

**Alternatives Considered**:
- NextAuth.js - More complex, Nhost auth is simpler and already integrated
- Custom JWT auth - Reinventing the wheel, security risks
- Nhost pre-built UI - Doesn't match design system, less control

**References**:
- https://docs.nhost.io/guides/auth/sign-in-sign-up
- https://docs.nhost.io/reference/javascript/auth

---

### 4. File Upload Strategy

**Decision**: Direct upload to Nhost Storage with automatic retry logic

**Rationale**:
- Nhost Storage is S3-compatible, reliable and scalable
- `useFileUpload` hook handles multipart uploads
- Automatic retry with exponential backoff aligns with FR-025
- Progress tracking built-in
- Presigned URLs for secure downloads
- Malware scanning available via Nhost configuration

**Implementation Pattern**:
```typescript
const { upload } = useFileUpload();

const handleUpload = async (file: File) => {
  try {
    const { id, error } = await upload({
      file,
      bucketId: 'resumes',
      name: file.name,
    });
    
    if (error) throw error;
    return id;
  } catch (error) {
    // Retry logic with exponential backoff
  }
};
```

**Alternatives Considered**:
- Chunked uploads with resumability - Complex, unnecessary for 10MB limit
- Queue-based background upload - Over-engineered for current needs
- Direct S3 upload - Nhost abstraction provides better DX

**References**:
- https://docs.nhost.io/guides/storage/upload-files
- https://docs.nhost.io/reference/javascript/storage

---

### 5. Rate Limiting and CAPTCHA

**Decision**: Combine Nhost rate limiting with custom CAPTCHA (reCAPTCHA v3)

**Rationale**:
- Nhost provides configurable rate limiting per endpoint
- reCAPTCHA v3 runs in background, no user interaction needed
- Falls back to v2 checkbox after threshold for accessibility
- Meets FR-013, FR-014, FR-015 requirements
- Industry standard for brute force protection

**Configuration**:
```typescript
// Nhost dashboard: Auth > Security
- Rate limiting: 5 requests per 15 minutes per IP
- CAPTCHA score threshold: 0.5
- Account lockout: 15 minutes after 5 failed attempts
```

**Alternatives Considered**:
- hCaptcha - Similar to reCAPTCHA, less common
- Custom CAPTCHA - Security risks, reinventing wheel
- No CAPTCHA - Violates security requirements

**References**:
- https://docs.nhost.io/guides/auth/security
- https://developers.google.com/recaptcha/docs/v3

---

### 6. Internationalization (i18n) Integration

**Decision**: Extend existing `next-intl` setup for auth messages

**Rationale**:
- Project already uses `next-intl` for English and Turkish
- Consistent with existing i18n patterns
- Nhost error messages need translation
- Form labels, validation messages, and UI text need i18n

**Message Structure**:
```json
// messages/en.json
{
  "auth": {
    "login": "Log in",
    "register": "Sign up",
    "email": "Email address",
    "password": "Password",
    "errors": {
      "invalid_credentials": "Invalid email or password",
      "email_taken": "Email already in use",
      "weak_password": "Password must be at least 8 characters"
    }
  },
  "files": {
    "upload": "Upload file",
    "delete": "Delete file",
    "errors": {
      "too_large": "File must be under 10MB",
      "invalid_type": "Unsupported file type"
    }
  }
}
```

**References**:
- https://next-intl-docs.vercel.app/
- Existing project setup in `lib/i18n.ts`

---

### 7. Environment Configuration

**Decision**: Environment-specific Nhost configuration with clear separation

**Rationale**:
- Different Nhost projects for local, staging, and production
- Secure credential management
- Easy switching between environments
- Aligns with user-provided configuration

**Configuration**:
```bash
# .env.local (local development)
NEXT_PUBLIC_NHOST_SUBDOMAIN=local
NEXT_PUBLIC_NHOST_REGION=

# .env.staging (template)
NEXT_PUBLIC_NHOST_SUBDOMAIN=bgkrpcjhawoxjnfxufdf
NEXT_PUBLIC_NHOST_REGION=eu-central-1

# .env.production (template)
NEXT_PUBLIC_NHOST_SUBDOMAIN=[production-subdomain]
NEXT_PUBLIC_NHOST_REGION=eu-central-1
```

**Alternatives Considered**:
- Single environment with feature flags - Complex, error-prone
- Hardcoded configuration - Insecure, inflexible
- Runtime configuration - Adds latency, unnecessary complexity

---

### 8. Session Management and Middleware

**Decision**: Use Nhost middleware for authentication and route protection

**Rationale**:
- Runs on Edge, fast response
- Automatic token refresh
- Server-side session verification
- Protects routes before page load
- Integrates with Next.js 15 middleware pattern

**Implementation**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@nhost/nextjs';

export async function middleware(request: NextRequest) {
  const nhost = await createServerClient();
  const session = await nhost.auth.getSession();
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard');
  
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}
```

**References**:
- https://docs.nhost.io/guides/quickstarts/nextjs#middleware
- https://nextjs.org/docs/app/building-your-application/routing/middleware

---

### 9. Error Handling and Logging

**Decision**: Structured error handling with comprehensive logging per FR-043

**Rationale**:
- Nhost SDK provides detailed error objects
- Log authentication failures per FR-044, FR-046
- Track GraphQL performance per FR-047
- Custom error boundary components
- Integration with monitoring tools (future: Sentry)

**Pattern**:
```typescript
try {
  const result = await signInEmailPassword(email, password);
  if (result.error) {
    logger.warn('Login failed', {
      email,
      error: result.error.message,
      ip: request.ip,
      timestamp: new Date().toISOString(),
    });
    throw new AuthError(result.error.message);
  }
} catch (error) {
  logger.error('Login exception', { error, email });
  throw error;
}
```

**References**:
- https://docs.nhost.io/reference/javascript/auth/sign-in-email-password
- Project requirement FR-043 through FR-048

---

### 10. Testing Strategy

**Decision**: Multi-layered testing with mocked Nhost SDK

**Rationale**:
- Unit tests: Component behavior with mocked Nhost hooks
- Integration tests: End-to-end auth flows with test environment
- E2E tests: Real Nhost instance for critical user journeys
- Aligns with TDD principles from constitution

**Test Structure**:
```typescript
// Unit test example
jest.mock('@nhost/nextjs', () => ({
  useSignInEmailPassword: jest.fn(),
}));

describe('LoginForm', () => {
  it('should call signIn with email and password', async () => {
    const mockSignIn = jest.fn();
    (useSignInEmailPassword as jest.Mock).mockReturnValue({
      signInEmailPassword: mockSignIn,
      isLoading: false,
      error: null,
    });
    
    // Test implementation
  });
});
```

**Test Environments**:
- Local: Mock Nhost SDK responses
- CI/CD: Nhost test project instance
- Staging: Real staging Nhost project

**References**:
- https://testing-library.com/docs/react-testing-library/intro/
- Existing `jest.config.ts` and `jest.setup.ts`

---

## Security Considerations

### 1. Token Storage
- Access tokens in memory only
- Refresh tokens in httpOnly cookies (Nhost default)
- No localStorage usage for sensitive data

### 2. API Security
- Row-level security (RLS) in Hasura for data isolation
- GraphQL permissions configured per user role
- File access controlled by ownership and permissions

### 3. HTTPS/WSS
- All Nhost endpoints use HTTPS
- WebSocket subscriptions use WSS
- No insecure connections allowed

### 4. Data Encryption
- Data at rest encrypted by Nhost (PostgreSQL)
- File storage encrypted (S3)
- Passwords hashed with bcrypt (Nhost default)

---

## Performance Optimizations

### 1. GraphQL Query Optimization
- Use fragments for reusable query parts
- Implement pagination for large datasets
- Enable query caching where appropriate
- Batch related queries

### 2. File Upload Optimization
- Compress images before upload
- Use presigned URLs for downloads
- Implement retry logic with exponential backoff
- Show upload progress to users

### 3. Bundle Size
- Dynamic imports for auth pages
- Code splitting by route
- Tree-shake unused Nhost SDK features

---

## Deployment Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use Vercel environment variables UI
- Separate configs for preview, staging, production

### 2. Database Migrations
- Use Hasura migrations for schema changes
- Version control all migrations
- Test migrations in staging first

### 3. Monitoring
- Enable Nhost monitoring dashboard
- Set up alerting for auth failures
- Monitor GraphQL query performance
- Track file storage usage

---

## Next Steps

All research complete. Ready to proceed to Phase 1: Design & Contracts.

**Resolved Clarifications**: All technical unknowns addressed
**Best Practices**: Nhost + Next.js patterns documented
**Integration Patterns**: Authentication, storage, GraphQL flows defined
**Security**: Comprehensive security measures planned
**Performance**: Optimization strategies identified
