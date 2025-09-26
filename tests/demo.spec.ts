import { test, expect } from '@playwright/test';

test.describe('Demo Tests', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveURL('http://localhost:3000/');

    // Check for main heading - adjust based on actual content
    await expect(page.locator('h1')).toBeVisible();

    // Check for navigation - use more specific selectors
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href="/products"]')).toBeVisible();
    await expect(page.locator('a[href="/about"]')).toBeVisible();
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Products');

    // Should navigate to products page
    await expect(page).toHaveURL(/products/);
  });

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/');
    await page.click('text=About');

    // Should navigate to about page
    await expect(page).toHaveURL(/about/);
  });
});
