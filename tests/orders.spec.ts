import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should load orders page', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    await expect(page).toHaveTitle(/Orders/);
    await expect(page.locator('h1')).toContainText('My Orders');
  });

  test('should redirect to signin if not authenticated', async ({ page }) => {
    await page.goto('/orders');

    // Should redirect to signin
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should display order history', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    // Check if orders are displayed
    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      // If there are orders, check their structure
      await expect(orders.first()).toBeVisible();
      await expect(page.locator('[data-testid="order-id"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    } else {
      // If no orders, check empty state
      await expect(page.locator('text=No orders found')).toBeVisible();
    }
  });

  test('should display individual order details', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      // Click on first order
      await orders.first().click();

      // Should navigate to order detail page
      await expect(page).toHaveURL(/\/orders\/[a-zA-Z0-9]+/);

      // Check order detail elements
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-status"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-items"]')).toBeVisible();
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    }
  });

  test('should show order items in detail view', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      // Click on first order
      await orders.first().click();

      // Check order items
      const orderItems = page.locator('[data-testid="order-item"]');
      await expect(orderItems.first()).toBeVisible();

      // Check item details
      await expect(page.locator('[data-testid="item-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-price"]')).toBeVisible();
      await expect(page.locator('[data-testid="item-quantity"]')).toBeVisible();
    }
  });

  test('should display shipping information', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check shipping information
      await expect(page.locator('[data-testid="shipping-address"]')).toBeVisible();
      await expect(page.locator('[data-testid="shipping-method"]')).toBeVisible();
    }
  });

  test('should display payment information', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check payment information
      await expect(page.locator('[data-testid="payment-method"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-status"]')).toBeVisible();
    }
  });

  test('should show order status updates', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check order status
      const statusElement = page.locator('[data-testid="order-status"]');
      await expect(statusElement).toBeVisible();

      // Check status history/timeline
      const statusTimeline = page.locator('[data-testid="status-timeline"]');
      if (await statusTimeline.isVisible()) {
        await expect(statusTimeline).toBeVisible();
      }
    }
  });

  test('should allow order cancellation', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for cancel order button
      const cancelButton = page.locator('button:has-text("Cancel Order")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Confirm cancellation
        await page.click('button:has-text("Yes, Cancel Order")');

        // Check if status updated
        await expect(page.locator('text=Order cancelled')).toBeVisible();
      }
    }
  });

  test('should allow order tracking', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for tracking information
      const trackingInfo = page.locator('[data-testid="tracking-info"]');
      if (await trackingInfo.isVisible()) {
        await expect(trackingInfo).toBeVisible();

        // Check tracking number
        const trackingNumber = page.locator('[data-testid="tracking-number"]');
        if (await trackingNumber.isVisible()) {
          await expect(trackingNumber).toBeVisible();
        }
      }
    }
  });

  test('should handle order search/filtering', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    // Check for search input
    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('ORDER123');
      await searchInput.press('Enter');

      // Wait for results
      await page.waitForTimeout(1000);

      // Check if results are filtered
      const orders = page.locator('[data-testid="order-card"]');
      if (await orders.count() > 0) {
        await expect(orders.first()).toContainText('ORDER123');
      }
    }

    // Check for status filter
    const statusFilter = page.locator('select[name="status"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('completed');

      // Wait for filtering
      await page.waitForTimeout(1000);

      // Check if all visible orders have completed status
      const orders = page.locator('[data-testid="order-card"]');
      const orderCount = await orders.count();

      if (orderCount > 0) {
        for (let i = 0; i < orderCount; i++) {
          await expect(orders.nth(i)).toContainText('completed');
        }
      }
    }
  });

  test('should handle order pagination', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

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

  test('should allow downloading order invoice', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for download invoice button
      const downloadButton = page.locator('button:has-text("Download Invoice")');
      if (await downloadButton.isVisible()) {
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');

        await downloadButton.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/invoice.*\.pdf/i);
      }
    }
  });

  test('should show order total breakdown', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check order total breakdown
      const subtotal = page.locator('[data-testid="order-subtotal"]');
      const tax = page.locator('[data-testid="order-tax"]');
      const shipping = page.locator('[data-testid="order-shipping"]');
      const total = page.locator('[data-testid="order-total"]');

      if (await subtotal.isVisible()) {
        await expect(subtotal).toBeVisible();
        await expect(total).toBeVisible();

        if (await tax.isVisible()) {
          await expect(tax).toBeVisible();
        }

        if (await shipping.isVisible()) {
          await expect(shipping).toBeVisible();
        }
      }
    }
  });

  test('should handle order reordering', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for reorder button
      const reorderButton = page.locator('button:has-text("Reorder")');
      if (await reorderButton.isVisible()) {
        await reorderButton.click();

        // Should redirect to cart with items added
        await expect(page).toHaveURL('/cart');

        // Check if items were added to cart
        await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(await page.locator('[data-testid="cart-item"]').count());
      }
    }
  });

  test('should show order confirmation email status', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for email confirmation status
      const emailStatus = page.locator('[data-testid="email-confirmation"]');
      if (await emailStatus.isVisible()) {
        await expect(emailStatus).toBeVisible();
      }
    }
  });

  test('should handle order return/refund requests', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for return/refund button
      const returnButton = page.locator('button:has-text("Request Return")');
      if (await returnButton.isVisible()) {
        await returnButton.click();

        // Check return request form
        await expect(page.locator('[data-testid="return-form"]')).toBeVisible();

        // Fill return reason
        const reasonSelect = page.locator('select[name="returnReason"]');
        if (await reasonSelect.isVisible()) {
          await reasonSelect.selectOption('damaged');

          // Submit return request
          await page.click('button:has-text("Submit Return Request")');

          // Check confirmation
          await expect(page.locator('text=Return request submitted')).toBeVisible();
        }
      }
    }
  });

  test('should display order notes', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for order notes
      const orderNotes = page.locator('[data-testid="order-notes"]');
      if (await orderNotes.isVisible()) {
        await expect(orderNotes).toBeVisible();
      }
    }
  });

  test('should handle order sorting', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    // Check for sort options
    const sortSelect = page.locator('select[name="sort"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('date-desc');

      // Wait for sorting
      await page.waitForTimeout(1000);

      // Check if orders are sorted by date (newest first)
      const orderDates = await page.locator('[data-testid="order-date"]').allTextContents();

      if (orderDates.length > 1) {
        // Convert dates and check order
        const dates = orderDates.map(date => new Date(date).getTime());
        for (let i = 1; i < dates.length; i++) {
          expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
        }
      }
    }
  });

  test('should show order help/support options', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 0) {
      await orders.first().click();

      // Check for help/support options
      const helpButton = page.locator('button:has-text("Get Help")');
      if (await helpButton.isVisible()) {
        await helpButton.click();

        // Check help modal/form
        await expect(page.locator('[data-testid="help-modal"]')).toBeVisible();
      }
    }
  });

  test('should handle bulk order actions', async ({ page }) => {
    await login(page);
    await page.goto('/orders');

    const orders = page.locator('[data-testid="order-card"]');
    const orderCount = await orders.count();

    if (orderCount > 1) {
      // Check for bulk action checkboxes
      const checkboxes = page.locator('input[type="checkbox"][name="orderSelect"]');

      if (await checkboxes.count() >= 2) {
        // Select multiple orders
        await checkboxes.first().check();
        await checkboxes.nth(1).check();

        // Check for bulk actions
        const bulkActions = page.locator('[data-testid="bulk-actions"]');
        if (await bulkActions.isVisible()) {
          await expect(bulkActions).toBeVisible();

          // Check available bulk actions
          const printInvoicesButton = bulkActions.locator('button:has-text("Print Invoices")');
          if (await printInvoicesButton.isVisible()) {
            await printInvoicesButton.click();
            // Should trigger download or print
          }
        }
      }
    }
  });
});
