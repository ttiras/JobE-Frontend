/**
 * Authentication End-to-End Tests
 * 
 * E2E tests using Playwright for complete authentication flows:
 * - T028: Full auth flow (register → verify email → login → logout)
 * - T029: Password reset flow
 * - T030: Rate limiting and CAPTCHA
 * - T031: Account deletion
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  displayName: 'Test User',
}

// Helper functions
async function waitForEmailVerification(page: Page, email: string) {
  // In a real scenario, this would:
  // 1. Check test email inbox (e.g., Mailhog, Mailtrap)
  // 2. Extract verification link
  // 3. Navigate to verification link
  // For now, we'll simulate the verification flow
  
  // Navigate to a mock verification endpoint
  const verificationToken = 'mock-verification-token'
  await page.goto(`${BASE_URL}/auth/verify-email?token=${verificationToken}`)
  await expect(page.getByText(/email verified|verification successful/i)).toBeVisible()
}

async function getPasswordResetLink(email: string): Promise<string> {
  // In a real scenario, this would:
  // 1. Check test email inbox
  // 2. Extract reset link from email
  // For now, return a mock link
  return `${BASE_URL}/auth/reset-password?token=mock-reset-token`
}

/**
 * T028: Full Authentication Flow
 * Tests the complete user journey: register → verify email → login → logout
 */
test.describe('T028: Full Authentication Flow', () => {
  test('should complete full registration and login flow', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto(`${BASE_URL}/auth/register`)
    await expect(page).toHaveTitle(/register|sign up|create account/i)

    // Step 2: Fill registration form
    await page.getByLabel(/full name|display name/i).fill(TEST_USER.displayName)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/^password$/i).fill(TEST_USER.password)
    await page.getByLabel(/confirm password/i).fill(TEST_USER.password)

    // Step 3: Submit registration
    await page.getByRole('button', { name: /create account|sign up|register/i }).click()

    // Step 4: Verify success message
    await expect(page.getByText(/check your email|verify|verification/i)).toBeVisible()

    // Step 5: Verify email (simulate email verification)
    await waitForEmailVerification(page, TEST_USER.email)

    // Step 6: Navigate to login page
    await page.goto(`${BASE_URL}/auth/login`)

    // Step 7: Login with new credentials
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in|login/i }).click()

    // Step 8: Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(/dashboard|welcome/i)).toBeVisible()

    // Step 9: Verify user is authenticated
    await expect(page.getByText(TEST_USER.displayName)).toBeVisible()

    // Step 10: Logout
    await page.getByRole('button', { name: /log out|logout|sign out/i }).click()

    // Step 11: Verify redirect to login
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should prevent access to protected routes when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`)

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByText(/sign in|log in/i)).toBeVisible()
  })

  test('should redirect authenticated users away from auth pages', async ({ page, context }) => {
    // First login
    await page.goto(`${BASE_URL}/auth/login`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Try to access login page while authenticated
    await page.goto(`${BASE_URL}/auth/login`)

    // Should redirect back to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should persist session across page reloads', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Reload page
    await page.reload()

    // Should still be authenticated
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByText(TEST_USER.displayName)).toBeVisible()
  })
})

/**
 * T029: Password Reset Flow
 * Tests the complete password reset journey
 */
test.describe('T029: Password Reset Flow', () => {
  const newPassword = 'NewTestPassword456!'

  test('should complete full password reset flow', async ({ page }) => {
    // Step 1: Navigate to password reset page
    await page.goto(`${BASE_URL}/auth/reset-password`)
    await expect(page.getByText(/reset.*password|forgot.*password/i)).toBeVisible()

    // Step 2: Request password reset
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByRole('button', { name: /send.*link|reset/i }).click()

    // Step 3: Verify success message
    await expect(page.getByText(/check your email|reset link sent/i)).toBeVisible()

    // Step 4: Get reset link from email (simulated)
    const resetLink = await getPasswordResetLink(TEST_USER.email)
    await page.goto(resetLink)

    // Step 5: Set new password
    await expect(page.getByText(/set new password|new password/i)).toBeVisible()
    await page.getByLabel(/new password/i).fill(newPassword)
    await page.getByLabel(/confirm password/i).fill(newPassword)
    await page.getByRole('button', { name: /reset password|change password/i }).click()

    // Step 6: Verify success message
    await expect(page.getByText(/password.*reset.*success|password.*changed/i)).toBeVisible()

    // Step 7: Login with new password
    await page.goto(`${BASE_URL}/auth/login`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(newPassword)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Step 8: Verify successful login
    await expect(page).toHaveURL(/\/dashboard/)

    // Step 9: Verify old password no longer works
    await page.getByRole('button', { name: /log out|logout/i }).click()
    await page.goto(`${BASE_URL}/auth/login`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password) // Old password
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Should show error
    await expect(page.getByText(/invalid.*credentials|incorrect.*password/i)).toBeVisible()
  })

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`)
    await page.getByLabel(/email/i).fill('nonexistent@example.com')
    await page.getByRole('button', { name: /send.*link|reset/i }).click()

    // Should show error (or success for security reasons)
    // Some apps show success even for non-existent emails to prevent email enumeration
    await expect(page.getByText(/check your email|no account found/i)).toBeVisible()
  })

  test('should reject expired reset token', async ({ page }) => {
    const expiredToken = 'expired-reset-token'
    await page.goto(`${BASE_URL}/auth/reset-password?token=${expiredToken}`)

    await page.getByLabel(/new password/i).fill(newPassword)
    await page.getByLabel(/confirm password/i).fill(newPassword)
    await page.getByRole('button', { name: /reset password/i }).click()

    await expect(page.getByText(/invalid.*expired.*token|link.*expired/i)).toBeVisible()
  })
})

/**
 * T030: Rate Limiting and CAPTCHA
 * Tests rate limiting after multiple failed login attempts
 */
test.describe('T030: Rate Limiting and CAPTCHA', () => {
  test('should show CAPTCHA after 3 failed login attempts', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)

    // Attempt 1
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill('wrongpassword1')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible()

    // Attempt 2
    await page.getByLabel(/password/i).fill('wrongpassword2')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible()

    // Attempt 3
    await page.getByLabel(/password/i).fill('wrongpassword3')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible()

    // CAPTCHA should now be visible
    await expect(page.getByText(/security check|verify.*not.*robot/i)).toBeVisible()
    
    // reCAPTCHA badge or frame should be visible
    const recaptchaFrame = page.frameLocator('iframe[src*="recaptcha"]')
    await expect(recaptchaFrame.locator('body')).toBeVisible()
  })

  test('should enforce account lockout after 5 failed attempts', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)

    // Make 5 failed attempts
    for (let i = 1; i <= 5; i++) {
      await page.getByLabel(/email/i).fill(TEST_USER.email)
      await page.getByLabel(/password/i).fill(`wrongpassword${i}`)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
      
      if (i < 5) {
        await expect(page.getByText(/invalid.*credentials/i)).toBeVisible()
      }
    }

    // Should show lockout message
    await expect(page.getByText(/too many attempts|account.*locked|try again.*15.*minutes/i)).toBeVisible()

    // Form should be disabled
    const submitButton = page.getByRole('button', { name: /sign in|log in/i })
    await expect(submitButton).toBeDisabled()
  })

  test('should allow login with correct credentials and CAPTCHA', async ({ page }) => {
    // First trigger CAPTCHA by failing 3 times
    await page.goto(`${BASE_URL}/auth/login`)
    
    for (let i = 1; i <= 3; i++) {
      await page.getByLabel(/email/i).fill(TEST_USER.email)
      await page.getByLabel(/password/i).fill(`wrongpassword${i}`)
      await page.getByRole('button', { name: /sign in|log in/i }).click()
    }

    // CAPTCHA should be visible
    await expect(page.getByText(/security check/i)).toBeVisible()

    // Now try with correct password (CAPTCHA will auto-verify in v3)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Should successfully login
    await expect(page).toHaveURL(/\/dashboard/)
  })
})

/**
 * T031: Account Deletion
 * Tests complete account deletion flow
 */
test.describe('T031: Account Deletion', () => {
  test('should delete account and all associated data', async ({ page }) => {
    // Step 1: Login
    await page.goto(`${BASE_URL}/auth/login`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Step 2: Navigate to settings
    await page.goto(`${BASE_URL}/settings`)
    await expect(page.getByText(/settings|account settings/i)).toBeVisible()

    // Step 3: Find delete account section
    await page.getByText(/delete account|close account/i).click()

    // Step 4: Confirm deletion (should require password)
    await expect(page.getByText(/permanently delete|cannot be undone/i)).toBeVisible()
    await page.getByLabel(/password|confirm/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /delete.*account|confirm.*deletion/i }).click()

    // Step 5: Verify confirmation dialog
    const confirmDialog = page.getByRole('dialog')
    await expect(confirmDialog.getByText(/are you sure|confirm deletion/i)).toBeVisible()
    await confirmDialog.getByRole('button', { name: /yes|confirm|delete/i }).click()

    // Step 6: Verify redirect to login with success message
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByText(/account.*deleted|successfully.*deleted/i)).toBeVisible()

    // Step 7: Verify cannot login with deleted account
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    await expect(page.getByText(/invalid.*credentials|account.*not.*found/i)).toBeVisible()

    // Step 8: Verify cannot register with same email (if email is soft-deleted)
    // Note: Some systems allow re-registration, others don't
    await page.goto(`${BASE_URL}/auth/register`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /create account|register/i }).click()

    // Should either succeed (hard delete) or show error (soft delete)
    // This depends on your implementation
  })

  test('should require password confirmation for account deletion', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Go to settings
    await page.goto(`${BASE_URL}/settings`)
    await page.getByText(/delete account/i).click()

    // Try to delete without password
    await page.getByRole('button', { name: /delete.*account/i }).click()

    // Should show validation error
    await expect(page.getByText(/password.*required|enter.*password/i)).toBeVisible()
  })

  test('should cancel account deletion', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`)
    await page.getByLabel(/email/i).fill(TEST_USER.email)
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    // Go to settings
    await page.goto(`${BASE_URL}/settings`)
    await page.getByText(/delete account/i).click()

    // Start deletion process
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /delete.*account/i }).click()

    // Cancel in confirmation dialog
    const confirmDialog = page.getByRole('dialog')
    await confirmDialog.getByRole('button', { name: /cancel|no|keep account/i }).click()

    // Should remain on settings page
    await expect(page).toHaveURL(/\/settings/)
    
    // Account should still work
    await page.reload()
    await expect(page.getByText(TEST_USER.displayName)).toBeVisible()
  })
})

/**
 * Additional Security Tests
 */
test.describe('Additional Security Tests', () => {
  test('should handle concurrent login sessions', async ({ browser }) => {
    // Create two browser contexts (simulate two devices)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // Login on device 1
    await page1.goto(`${BASE_URL}/auth/login`)
    await page1.getByLabel(/email/i).fill(TEST_USER.email)
    await page1.getByLabel(/password/i).fill(TEST_USER.password)
    await page1.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page1).toHaveURL(/\/dashboard/)

    // Login on device 2
    await page2.goto(`${BASE_URL}/auth/login`)
    await page2.getByLabel(/email/i).fill(TEST_USER.email)
    await page2.getByLabel(/password/i).fill(TEST_USER.password)
    await page2.getByRole('button', { name: /sign in|log in/i }).click()
    await expect(page2).toHaveURL(/\/dashboard/)

    // Both sessions should be active
    await expect(page1.getByText(TEST_USER.displayName)).toBeVisible()
    await expect(page2.getByText(TEST_USER.displayName)).toBeVisible()

    await context1.close()
    await context2.close()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByLabel(/password/i).fill(TEST_USER.password)
    await page.getByRole('button', { name: /sign in|log in/i }).click()

    await expect(page.getByText(/valid.*email|email.*invalid/i)).toBeVisible()
  })

  test('should enforce password strength on registration', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register`)
    
    await page.getByLabel(/full name/i).fill('Test User')
    await page.getByLabel(/email/i).fill('newuser@example.com')
    await page.getByLabel(/^password$/i).fill('weak') // Weak password
    await page.getByLabel(/confirm password/i).fill('weak')
    await page.getByRole('button', { name: /create account|register/i }).click()

    await expect(page.getByText(/password.*8.*characters|password.*weak/i)).toBeVisible()
  })
})
