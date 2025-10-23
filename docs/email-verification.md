# Email Verification Flow

## Overview

JobE uses Nhost's built-in email verification system to ensure users have valid email addresses before they can fully access the application.

## How It Works

### 1. Registration

When a user registers:
```typescript
const result = await register(email, password, displayName)
```

Nhost automatically:
- Creates the user account
- Sets `emailVerified: false` on the user record
- Sends a verification email with a magic link

### 2. Verification Email

The email contains a link like:
```
https://yourdomain.com/en/auth/verify-email?type=emailVerify&refreshToken=xxx...
```

Key URL parameters:
- `type=emailVerify` - Identifies this as an email verification
- `refreshToken=xxx` - Authentication token (present on success)
- `error=xxx` - Error code (present on failure)
- `errorDescription=xxx` - Human-readable error message

### 3. Verification Page

The verify-email page (`app/[locale]/(auth)/verify-email/page.tsx`):

**Success State:**
- Detects `type=emailVerify` and `refreshToken` in URL
- Shows success icon and message
- Provides "Continue to Login" button

**Error State:**
- Detects `type=emailVerify` and `error` in URL
- Shows error icon and message
- Displays error description from Nhost
- Provides "Try Again" button to re-register

**Pending State:**
- No URL parameters (user just registered)
- Shows loading icon and waiting message
- Reminds user to check spam folder

## Configuration

### Environment Variables

Set in `.env.local`:
```bash
# Your application URL for email redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Nhost Client Setup

Redirect URLs are configured in `lib/nhost/client.ts`:

```typescript
export function getVerifyEmailRedirectUrl(locale: string = 'en'): string {
  return `${getBaseUrl()}/${locale}/auth/verify-email`
}
```

### Sending Verification Emails

The `sendVerificationEmail` function (in `lib/nhost/auth.ts`) now accepts a locale parameter:

```typescript
await sendVerificationEmail(email, 'en') // English
await sendVerificationEmail(email, 'tr') // Turkish
```

This ensures the verification page uses the correct language.

## User Experience

### After Registration

1. User submits registration form
2. Success toast appears: "Registration successful! Please check your email."
3. User is redirected to `/auth/verify-email` (pending state)
4. Page shows: "Check your email for a verification link"

### After Clicking Email Link

**Success:**
1. User clicks link in email
2. Nhost verifies the token
3. User is redirected to `/auth/verify-email?type=emailVerify&refreshToken=xxx`
4. Page shows: "Email verified successfully!"
5. User clicks "Continue to Login" button
6. User can now log in

**Failure (e.g., expired link):**
1. User clicks link in email
2. Nhost detects expired/invalid token
3. User is redirected to `/auth/verify-email?type=emailVerify&error=invalid-ticket&errorDescription=Ticket%20has%20expired`
4. Page shows: "Verification failed: Ticket has expired"
5. User clicks "Try Again" button
6. User can request a new verification email

## Common Scenarios

### Resending Verification Email

If a user needs a new verification email:

```typescript
import { sendVerificationEmail } from '@/lib/nhost/auth'

try {
  await sendVerificationEmail(userEmail, currentLocale)
  toast.success('Verification email sent!')
} catch (error) {
  toast.error('Failed to send verification email')
}
```

### Checking Verification Status

The user's verification status is available in the auth context:

```typescript
const { user } = useAuth()
const isVerified = user?.emailVerified // true or false
```

### Expired Links

Verification links expire after a certain time (configured in Nhost dashboard, typically 24 hours). If expired:
- User sees error message on verify-email page
- User can re-register or request a new verification email
- Old user record may need to be cleaned up (handled by Nhost)

## Nhost Dashboard Configuration

In your Nhost project dashboard:

1. **Auth → Settings → Email Templates**
   - Customize the verification email template
   - Add your branding and messaging
   - Template variables: `{{display_name}}`, `{{verification_url}}`

2. **Auth → Settings → Redirects**
   - Set allowed redirect URLs for security
   - Add your app URLs: `http://localhost:3000/*`, `https://yourdomain.com/*`

3. **Auth → Settings → Email**
   - Configure SMTP settings (production)
   - Test email sending
   - Set "From" name and address

## Testing

### Local Development

1. Use Nhost's email testing interface in the dashboard
2. Emails appear in the "Email" tab during local development
3. Click "View" to see the email content and verification link

### Production

1. Ensure `NEXT_PUBLIC_APP_URL` is set to production URL
2. Test with real email addresses
3. Verify emails arrive and links work
4. Check spam folders if emails don't arrive

## Security Considerations

1. **Token Expiry**: Verification tokens expire to prevent replay attacks
2. **Single Use**: Tokens can only be used once
3. **Allowed Redirects**: Nhost validates redirect URLs against allowed list
4. **HTTPS**: Always use HTTPS in production for email links
5. **Email Privacy**: Don't expose whether an email exists in error messages

## Troubleshooting

### Emails Not Arriving

- Check Nhost email logs in dashboard
- Verify SMTP configuration
- Check spam folders
- Ensure email address is valid

### Redirect Errors

- Verify `NEXT_PUBLIC_APP_URL` is correct
- Check Nhost allowed redirect URLs
- Ensure URL includes protocol (http/https)

### Verification Fails

- Check if token expired
- Verify link hasn't been used already
- Check Nhost logs for detailed error

## Related Files

- `app/[locale]/(auth)/verify-email/page.tsx` - Verification page
- `lib/nhost/auth.ts` - Auth utilities
- `lib/nhost/client.ts` - Nhost client and redirect URLs
- `messages/en.json` - English translations
- `messages/tr.json` - Turkish translations
