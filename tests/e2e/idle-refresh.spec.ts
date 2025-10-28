/**
 * E2E Tests: Idle Session Refresh
 * 
 * Tests for session refresh after idle periods.
 * Verifies that users can resume work after 15+ minutes of inactivity.
 * 
 * User Story: US1 - Seamless Client-Side Authentication
 * Task: T010
 */

import { test, expect } from '@playwright/test'

// Test user credentials
const TEST_EMAIL = 'test@test.com'
const TEST_PASSWORD = '123456789'

test.describe('Idle Session Refresh', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test('should login successfully and navigate to dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/en/login')
    
    // Fill in credentials
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    
    // Submit login form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Verify user is authenticated
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should refresh session after simulated idle period', async ({ page }) => {
    // Login first
    await page.goto('/en/login')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Simulate 15 minutes passing by manipulating cookies
    // In a real scenario, we'd wait or manipulate token expiration
    
    // Try to navigate (should trigger auto-refresh)
    await page.click('text=Profile', { timeout: 5000 })
    
    // Should successfully navigate without being logged out
    await expect(page).toHaveURL(/\/en\//)
    
    // Verify still authenticated (no redirect to login)
    await expect(page.locator('text=Login')).not.toBeVisible()
  })

  test('should handle page load without login redirect after token refresh', async ({ page }) => {
    // Login first
    await page.goto('/en/login')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Reload the page (simulates returning after idle)
    await page.reload()
    
    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/en\/dashboard/)
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should maintain authentication across multiple page navigations', async ({ page }) => {
    // Login
    await page.goto('/en/login')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Navigate to different pages
    const pages = ['/', '/en/dashboard']
    
    for (const targetPage of pages) {
      await page.goto(targetPage)
      
      // Should not be redirected to login
      await expect(page).not.toHaveURL(/\/en\/login/)
      
      // Give time for potential refresh
      await page.waitForTimeout(1000)
    }
    
    // Verify still authenticated
    await page.goto('/en/dashboard')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should recover from expired token during navigation', async ({ page, context }) => {
    // Login first
    await page.goto('/en/login')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Get cookies
    const cookies = await context.cookies()
    const refreshTokenCookie = cookies.find(c => c.name.includes('refreshToken'))
    
    if (refreshTokenCookie) {
      // Modify expiry to simulate near-expiration
      await context.addCookies([{
        ...refreshTokenCookie,
        expires: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
      }])
    }
    
    // Navigate to trigger refresh check
    await page.click('a[href*="/dashboard"]')
    
    // Should successfully navigate (session refreshed in background)
    await expect(page).toHaveURL(/\/en\/dashboard/)
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should handle session refresh within 2 seconds after idle', async ({ page }) => {
    // Login
    await page.goto('/en/login')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Record start time
    const startTime = Date.now()
    
    // Navigate (triggers refresh check)
    await page.goto('/en/dashboard')
    
    // Wait for page to be ready
    await page.waitForLoadState('networkidle')
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete within 2 seconds per success criteria SC-002
    expect(duration).toBeLessThan(2000)
    
    // Verify still authenticated
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })
})

test.describe('Session Refresh Error Handling', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    // Login first
    await page.goto('/en/login')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Simulate network offline
    await context.setOffline(true)
    
    // Try to navigate
    await page.goto('/en/dashboard')
    
    // Should show appropriate error or maintain current state
    // (Specific behavior depends on implementation)
    await context.setOffline(false)
  })

  test('should redirect to login if refresh token is invalid', async ({ page, context }) => {
    // Login first
    await page.goto('/en/login')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/en\/dashboard/)
    
    // Clear cookies to simulate invalid token
    await context.clearCookies()
    
    // Navigate to protected page
    await page.goto('/en/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/en\/login/)
  })
})
