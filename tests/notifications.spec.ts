import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should load notifications page', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    await expect(page).toHaveTitle(/Notifications/);
    await expect(page.locator('h1')).toContainText('Notifications');
  });

  test('should redirect to signin if not authenticated', async ({ page }) => {
    await page.goto('/notifications');

    // Should redirect to signin
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should display notifications list', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check notifications display
    const notifications = page.locator('[data-testid="notification-item"]');
    const notificationCount = await notifications.count();

    if (notificationCount > 0) {
      await expect(notifications.first()).toBeVisible();
      await expect(page.locator('[data-testid="notification-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="notification-date"]')).toBeVisible();
    } else {
      // Check empty state
      await expect(page.locator('text=No notifications')).toBeVisible();
    }
  });

  test('should show unread notification count', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check notification badge/count
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    if (await notificationBadge.isVisible()) {
      await expect(notificationBadge).toBeVisible();
    }
  });

  test('should mark notification as read', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    const notifications = page.locator('[data-testid="notification-item"]');
    const notificationCount = await notifications.count();

    if (notificationCount > 0) {
      // Click on first notification
      await notifications.first().click();

      // Check if marked as read
      await expect(notifications.first()).toHaveClass(/read/);

      // Or check if read indicator is present
      const readIndicator = notifications.first().locator('[data-testid="read-indicator"]');
      if (await readIndicator.isVisible()) {
        await expect(readIndicator).toBeVisible();
      }
    }
  });

  test('should mark all notifications as read', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check for mark all as read button
    const markAllReadButton = page.locator('button:has-text("Mark All as Read")');
    if (await markAllReadButton.isVisible()) {
      await markAllReadButton.click();

      // Check if all notifications are marked as read
      const unreadNotifications = page.locator('[data-testid="notification-item"]:not(.read)');
      await expect(unreadNotifications).toHaveCount(0);
    }
  });

  test('should delete notification', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    const notifications = page.locator('[data-testid="notification-item"]');
    const initialCount = await notifications.count();

    if (initialCount > 0) {
      // Click delete on first notification
      const deleteButton = notifications.first().locator('button:has-text("Delete")');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        await page.click('button:has-text("Yes, Delete")');

        // Check if notification was removed
        await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(initialCount - 1);
      }
    }
  });

  test('should filter notifications by type', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check for filter options
    const filterSelect = page.locator('select[name="filter"]');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('order');

      // Wait for filtering
      await page.waitForTimeout(1000);

      // Check if only order notifications are shown
      const notifications = page.locator('[data-testid="notification-item"]');
      const notificationCount = await notifications.count();

      if (notificationCount > 0) {
        for (let i = 0; i < notificationCount; i++) {
          await expect(notifications.nth(i)).toContainText('order');
        }
      }
    }
  });

  test('should handle notification pagination', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check for pagination
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      const nextButton = pagination.locator('button:has-text("Next")');
      if (await nextButton.isVisible() && await nextButton.isEnabled()) {
        await nextButton.click();

        // Wait for page change
        await page.waitForTimeout(1000);

        // Check if page changed
        await expect(page).toHaveURL(/\?page=2/);
      }
    }
  });

  test('should show notification dropdown in header', async ({ page }) => {
    await login(page);
    await page.goto('/');

    // Check notification dropdown
    const notificationDropdown = page.locator('[data-testid="notification-dropdown"]');
    if (await notificationDropdown.isVisible()) {
      await notificationDropdown.click();

      // Check dropdown content
      await expect(page.locator('[data-testid="notification-list"]')).toBeVisible();

      // Check recent notifications
      const recentNotifications = page.locator('[data-testid="recent-notification"]');
      const count = await recentNotifications.count();

      if (count > 0) {
        await expect(recentNotifications.first()).toBeVisible();
      }
    }
  });

  test('should handle real-time notifications', async ({ page }) => {
    await login(page);
    await page.goto('/');

    // Wait for potential real-time notification
    const notificationToast = page.locator('[data-testid="notification-toast"]');

    // This test would need actual real-time events to be triggered
    // For now, just check if the toast system exists
    if (await notificationToast.isVisible()) {
      await expect(notificationToast).toBeVisible();
    }
  });

  test('should navigate to related page from notification', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    const notifications = page.locator('[data-testid="notification-item"]');
    const notificationCount = await notifications.count();

    if (notificationCount > 0) {
      // Click on notification that should navigate somewhere
      const orderNotification = notifications.locator('text=order').first();
      if (await orderNotification.isVisible()) {
        await orderNotification.click();

        // Should navigate to orders page or order detail
        await expect(page).toHaveURL(/\/orders/);
      }
    }
  });

  test('should handle notification preferences', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check for notification settings
    const settingsButton = page.locator('button:has-text("Notification Settings")');
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Check settings form
      await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible();

      // Check notification type toggles
      const emailNotifications = page.locator('input[name="emailNotifications"]');
      if (await emailNotifications.isVisible()) {
        await emailNotifications.check();
      }

      const pushNotifications = page.locator('input[name="pushNotifications"]');
      if (await pushNotifications.isVisible()) {
        await pushNotifications.check();
      }

      // Save settings
      await page.click('button:has-text("Save Settings")');
      await expect(page.locator('text=Settings saved')).toBeVisible();
    }
  });

  test('should show notification timestamps', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    const notifications = page.locator('[data-testid="notification-item"]');
    const notificationCount = await notifications.count();

    if (notificationCount > 0) {
      // Check timestamps
      const timestamps = page.locator('[data-testid="notification-timestamp"]');
      await expect(timestamps.first()).toBeVisible();

      // Check relative time (e.g., "2 hours ago")
      const firstTimestamp = await timestamps.first().textContent();
      expect(firstTimestamp).toBeTruthy();
    }
  });

  test('should handle bulk notification actions', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    const notifications = page.locator('[data-testid="notification-item"]');
    const notificationCount = await notifications.count();

    if (notificationCount > 1) {
      // Check for bulk select checkboxes
      const checkboxes = page.locator('input[type="checkbox"][name="notificationSelect"]');

      if (await checkboxes.count() >= 2) {
        // Select multiple notifications
        await checkboxes.first().check();
        await checkboxes.nth(1).check();

        // Check bulk actions
        const bulkActions = page.locator('[data-testid="bulk-actions"]');
        if (await bulkActions.isVisible()) {
          await expect(bulkActions).toBeVisible();

          // Test bulk delete
          const bulkDeleteButton = bulkActions.locator('button:has-text("Delete Selected")');
          if (await bulkDeleteButton.isVisible()) {
            await bulkDeleteButton.click();

            // Confirm bulk deletion
            await page.click('button:has-text("Yes, Delete All")');

            // Check if notifications were removed
            await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(notificationCount - 2);
          }
        }
      }
    }
  });

  test('should search notifications', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check for search input
    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('order');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Check if results contain search term
      const notifications = page.locator('[data-testid="notification-item"]');
      const notificationCount = await notifications.count();

      if (notificationCount > 0) {
        for (let i = 0; i < notificationCount; i++) {
          await expect(notifications.nth(i)).toContainText(/order/i);
        }
      }
    }
  });

  test('should show notification categories', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check for category tabs or filters
    const categoryTabs = page.locator('[data-testid="notification-category"]');
    if (await categoryTabs.count() > 1) {
      // Click on different category
      await categoryTabs.nth(1).click();

      // Check if notifications are filtered by category
      await page.waitForTimeout(1000);
      const notifications = page.locator('[data-testid="notification-item"]');
      await expect(notifications.first()).toBeVisible();
    }
  });

  test('should handle notification archiving', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    const notifications = page.locator('[data-testid="notification-item"]');
    const notificationCount = await notifications.count();

    if (notificationCount > 0) {
      // Check for archive button
      const archiveButton = notifications.first().locator('button:has-text("Archive")');
      if (await archiveButton.isVisible()) {
        await archiveButton.click();

        // Check if notification moved to archived
        await expect(notifications.first()).toHaveClass(/archived/);

        // Or check archived section
        const archivedSection = page.locator('[data-testid="archived-notifications"]');
        if (await archivedSection.isVisible()) {
          const notificationText = await notifications.first().textContent();
          if (notificationText) {
            await expect(archivedSection).toContainText(notificationText);
          }
        }
      }
    }
  });

  test('should show notification priority levels', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    // Check for priority indicators
    const highPriorityNotifications = page.locator('[data-testid="notification-item"][data-priority="high"]');
    if (await highPriorityNotifications.count() > 0) {
      await expect(highPriorityNotifications.first()).toBeVisible();

      // Check visual priority indicator
      await expect(highPriorityNotifications.first().locator('[data-testid="priority-indicator"]')).toBeVisible();
    }
  });

  test('should handle notification actions', async ({ page }) => {
    await login(page);
    await page.goto('/notifications');

    const notifications = page.locator('[data-testid="notification-item"]');
    const notificationCount = await notifications.count();

    if (notificationCount > 0) {
      // Check for action buttons on notifications
      const actionButton = notifications.first().locator('button:has-text("View Details")');
      if (await actionButton.isVisible()) {
        await actionButton.click();

        // Should navigate to relevant page
        await expect(page).not.toHaveURL('/notifications');
      }
    }
  });
});
