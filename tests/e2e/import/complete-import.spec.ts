/**
 * E2E Tests for Complete Import Journey
 * 
 * Tests: T026 [US1]
 * Following TDD: Full end-to-end test with browser automation
 * 
 * Complete Flow:
 * 1. Navigate to import page
 * 2. Upload Excel file
 * 3. View validation results
 * 4. Review data preview
 * 5. Confirm import
 * 6. Verify success message
 * 7. Verify data in database
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Excel Import Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to import page
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/dashboard/import');
  });

  test('should complete successful import with valid Excel file', async ({ page }) => {
    // Step 1: Upload Excel file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');

    // Step 2: Wait for parsing and validation
    await expect(page.getByText('Parsing file...')).toBeVisible();
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Step 3: Verify no validation errors
    await expect(page.getByText('No errors found')).toBeVisible();
    await expect(page.getByRole('alert')).not.toBeVisible();

    // Step 4: Review preview data
    await expect(page.getByText('Departments')).toBeVisible();
    await expect(page.getByText('Positions')).toBeVisible();
    
    // Check summary statistics
    await expect(page.getByText(/3 total/)).toBeVisible();
    await expect(page.getByText(/2 new/)).toBeVisible();
    await expect(page.getByText(/1 updates/)).toBeVisible();

    // Step 5: Click continue to confirmation
    await page.click('button:has-text("Continue")');

    // Step 6: Review confirmation dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Confirm Import')).toBeVisible();
    await expect(page.getByText('This operation will modify your organization structure')).toBeVisible();

    // Step 7: Confirm import
    await page.click('button:has-text("Confirm Import")');

    // Step 8: Wait for import completion
    await expect(page.getByText('Importing...')).toBeVisible();
    await expect(page.getByText('Import completed successfully')).toBeVisible({ timeout: 15000 });

    // Step 9: Verify success message details
    await expect(page.getByText('3 departments')).toBeVisible();
    await expect(page.getByText('5 positions')).toBeVisible();

    // Step 10: Navigate to org chart to verify
    await page.click('a:has-text("View Organization Chart")');
    await page.waitForURL(/\/dashboard\/org-chart/);
    
    // Verify new departments appear
    await expect(page.getByText('Engineering')).toBeVisible();
    await expect(page.getByText('Human Resources')).toBeVisible();
  });

  test('should display validation errors for invalid file', async ({ page }) => {
    // Upload file with validation errors
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/invalid-circular-refs.xlsx');

    // Wait for parsing
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Verify error messages are displayed
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/Circular reference detected/)).toBeVisible();
    await expect(page.getByText(/Row 3/)).toBeVisible();

    // Continue button should be disabled
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await expect(continueButton).toBeDisabled();

    // Error details should be expandable
    await page.click('button:has-text("Show Details")');
    await expect(page.getByText('Department A → Department B → Department C → Department A')).toBeVisible();
  });

  test('should handle file upload errors gracefully', async ({ page }) => {
    // Try to upload non-Excel file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/invalid-file.txt');

    // Verify error message
    await expect(page.getByText('Please upload a valid Excel file (.xlsx or .xls)')).toBeVisible();
    
    // Preview section should not be shown
    await expect(page.getByText('Departments')).not.toBeVisible();
  });

  test('should handle file size limit', async ({ page }) => {
    // Try to upload file larger than 5MB
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/large-file.xlsx');

    // Verify error message
    await expect(page.getByText('File size must be less than 5MB')).toBeVisible();
  });

  test('should allow user to cancel import', async ({ page }) => {
    // Upload valid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');

    // Wait for preview
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Continue")');

    // Open confirmation dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    // Click cancel
    await page.click('button:has-text("Cancel")');

    // Dialog should close
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Should return to preview page
    await expect(page.getByText('Departments')).toBeVisible();
  });

  test('should preserve data when navigating back', async ({ page }) => {
    // Upload file and view preview
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Verify preview is shown
    await expect(page.getByText(/3 total/)).toBeVisible();

    // Navigate away
    await page.goto('/dashboard');

    // Navigate back
    await page.goto('/dashboard/import');

    // Data should be cleared (no session persistence for safety)
    await expect(page.getByText('Departments')).not.toBeVisible();
    await expect(fileInput).toBeVisible();
  });

  test('should show progress during large file import', async ({ page }) => {
    // Upload large file with 1000+ records
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/large-import-1000.xlsx');

    // Wait for parsing with progress indicator
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText(/Parsing.../)).toBeVisible();

    // Progress should update
    await expect(page.getByText(/50%/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/100%/)).toBeVisible({ timeout: 10000 });

    // Continue to import
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Confirm Import")');

    // Import progress should be shown
    await expect(page.getByText('Importing departments...')).toBeVisible();
    await expect(page.getByText('Importing positions...')).toBeVisible();
    
    // Final success
    await expect(page.getByText('Import completed successfully')).toBeVisible({ timeout: 30000 });
  });

  test('should handle network errors during import', async ({ page }) => {
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Simulate network offline
    await page.context().setOffline(true);

    // Try to import
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Confirm Import")');

    // Should show error
    await expect(page.getByText('Network error. Please check your connection.')).toBeVisible({ timeout: 10000 });
    
    // Restore network
    await page.context().setOffline(false);

    // Retry button should be available
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('should display warnings for positions without incumbents', async ({ page }) => {
    // Upload file with warning conditions
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/import-with-warnings.xlsx');

    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Should show warnings but allow continue
    await expect(page.getByText(/2 warnings/)).toBeVisible();
    await expect(page.getByText('Position has 0 incumbents')).toBeVisible();

    // Continue button should be enabled
    const continueButton = page.getByRole('button', { name: 'Continue' });
    await expect(continueButton).toBeEnabled();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Tab to continue button and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Check ARIA attributes
    const fileUploadZone = page.locator('[role="button"][aria-label*="upload"]');
    await expect(fileUploadZone).toHaveAttribute('tabindex', '0');

    // Check dialog accessibility
    await page.click('button:has-text("Continue")');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('aria-labelledby');
  });

  test('should handle duplicate codes in UPDATE operations', async ({ page }) => {
    // Upload file trying to update with duplicate codes
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/duplicate-updates.xlsx');

    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Should show error for duplicates
    await expect(page.getByText('Duplicate department code: HR')).toBeVisible();
    await expect(page.getByText('Rows 2 and 4')).toBeVisible();

    // Cannot continue
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  test('should display operation type indicators correctly', async ({ page }) => {
    // Upload file with mixed operations
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/mixed-operations.xlsx');

    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Check CREATE badges
    const createBadges = page.locator('text=Create');
    await expect(createBadges).toHaveCount(4);

    // Check UPDATE badges
    const updateBadges = page.locator('text=Update');
    await expect(updateBadges).toHaveCount(2);

    // Verify badge colors (CREATE=green, UPDATE=blue)
    const firstCreate = createBadges.first();
    await expect(firstCreate).toHaveClass(/bg-green/);

    const firstUpdate = updateBadges.first();
    await expect(firstUpdate).toHaveClass(/bg-blue/);
  });

  test('should handle session timeout during import', async ({ page }) => {
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });

    // Simulate session expiration by clearing cookies
    await page.context().clearCookies();

    // Try to import
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Confirm Import")');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Your session has expired')).toBeVisible();
  });

  test('should allow starting over after completion', async ({ page }) => {
    // Complete import
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');
    await expect(page.getByText('Parsing file...')).not.toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Confirm Import")');
    await expect(page.getByText('Import completed successfully')).toBeVisible({ timeout: 15000 });

    // Click "Import Another File"
    await page.click('button:has-text("Import Another File")');

    // Should reset to initial state
    await expect(fileInput).toBeVisible();
    await expect(page.getByText('Import completed successfully')).not.toBeVisible();
  });

  test('should display bilingual content (EN/TR toggle)', async ({ page }) => {
    // Default English
    await expect(page.getByText('Upload Excel File')).toBeVisible();

    // Switch to Turkish
    await page.click('button[aria-label="Language selector"]');
    await page.click('button:has-text("Türkçe")');

    // Verify Turkish content
    await expect(page.getByText('Excel Dosyası Yükle')).toBeVisible();

    // Upload file and check Turkish translations
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/valid-import.xlsx');
    await expect(page.getByText('Dosya işleniyor...')).toBeVisible();
    await expect(page.getByText('Dosya işleniyor...')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Departmanlar')).toBeVisible();
    await expect(page.getByText('Pozisyonlar')).toBeVisible();
  });
});

test.describe('Import Permissions and RBAC', () => {
  test('should restrict import to authorized roles only', async ({ page }) => {
    // Login as non-admin user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'viewer@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Try to access import page
    await page.goto('/dashboard/import');

    // Should redirect or show access denied
    await expect(page.getByText('Access Denied')).toBeVisible();
    await expect(page.getByText('You do not have permission to import data')).toBeVisible();
  });

  test('should allow import for admin role', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'testpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Access import page
    await page.goto('/dashboard/import');

    // Should have full access
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.getByText('Access Denied')).not.toBeVisible();
  });
});
