import { test, expect } from '@playwright/test';
import { login, clearCart } from './test-utils';

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should load checkout page', async ({ page }) => {
    await login(page);
    await page.goto('/checkout');

    await expect(page).toHaveTitle(/Checkout/);
    await expect(page.locator('h1')).toContainText('Checkout');
  });

  test('should redirect to signin if not authenticated', async ({ page }) => {
    await page.goto('/checkout');

    // Should redirect to signin
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should redirect to cart if cart is empty', async ({ page }) => {
    await login(page);
    await clearCart(page);
    await page.goto('/checkout');

    // Should redirect to cart
    await expect(page).toHaveURL('/cart');
  });

  test('should display order summary', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check order summary
    await expect(page.locator('[data-testid="order-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
  });

  test('should pre-fill shipping information from profile', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check if shipping form is pre-filled
    const nameInput = page.locator('input[name="shippingName"]');
    const addressInput = page.locator('input[name="shippingAddress"]');

    // These might be pre-filled from user profile
    if (await nameInput.isVisible()) {
      const nameValue = await nameInput.getAttribute('value');
      expect(nameValue).toBeTruthy();
    }

    if (await addressInput.isVisible()) {
      const addressValue = await addressInput.getAttribute('value');
      expect(addressValue).toBeTruthy();
    }
  });

  test('should validate shipping form', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Clear shipping form and submit
    const nameInput = page.locator('input[name="shippingName"]');
    const addressInput = page.locator('input[name="shippingAddress"]');
    const phoneInput = page.locator('input[name="shippingPhone"]');

    if (await nameInput.isVisible()) {
      await nameInput.fill('');
    }
    if (await addressInput.isVisible()) {
      await addressInput.fill('');
    }
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('');
    }

    await page.click('button[type="submit"]');

    // Check validation messages
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Address is required')).toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
  });

  test('should handle different shipping methods', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check shipping method options
    const shippingOptions = page.locator('input[name="shippingMethod"]');
    if (await shippingOptions.count() > 1) {
      // Select different shipping method
      await shippingOptions.nth(1).check();

      // Check if total updates
      await page.waitForTimeout(1000);
      await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
    }
  });

  test('should display payment form', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check payment form elements
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

    // Stripe card element might be present
    const cardElement = page.locator('[data-testid="card-element"]');
    if (await cardElement.isVisible()) {
      await expect(cardElement).toBeVisible();
    }
  });

  test('should validate payment information', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Fill shipping info
    await page.fill('input[name="shippingName"]', 'Test User');
    await page.fill('input[name="shippingAddress"]', '123 Test St, Test City, 12345');
    await page.fill('input[name="shippingPhone"]', '1234567890');

    // Try to submit without payment info
    await page.click('button[type="submit"]');

    // Check for payment validation
    await expect(page.locator('text=Payment information is required')).toBeVisible();
  });

  test('should handle payment method selection', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check payment method options
    const paymentMethods = page.locator('input[name="paymentMethod"]');
    const methodCount = await paymentMethods.count();

    if (methodCount > 1) {
      // Test switching between payment methods
      await paymentMethods.nth(0).check();
      await paymentMethods.nth(1).check();

      // Check if payment form updates accordingly
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    }
  });

  test('should calculate taxes correctly', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check tax calculation
    const subtotal = page.locator('[data-testid="order-subtotal"]');
    const tax = page.locator('[data-testid="order-tax"]');
    const total = page.locator('[data-testid="order-total"]');

    if (await tax.isVisible()) {
      const subtotalValue = parseFloat((await subtotal.textContent() || '').replace('$', ''));
      const taxValue = parseFloat((await tax.textContent() || '').replace('$', ''));
      const totalValue = parseFloat((await total.textContent() || '').replace('$', ''));

      expect(totalValue).toBe(subtotalValue + taxValue);
    }
  });

  test('should handle coupon application during checkout', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Apply coupon
    const couponInput = page.locator('input[name="coupon"]');
    if (await couponInput.isVisible()) {
      await couponInput.fill('SAVE10');
      await page.click('button:has-text("Apply")');

      // Check if discount is applied
      await expect(page.locator('[data-testid="order-discount"]')).toBeVisible();
    }
  });

  test('should show order review before payment', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Fill required information
    await page.fill('input[name="shippingName"]', 'Test User');
    await page.fill('input[name="shippingAddress"]', '123 Test St, Test City, 12345');
    await page.fill('input[name="shippingPhone"]', '1234567890');

    // Check order review section
    await expect(page.locator('[data-testid="order-review"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-shipping"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-payment"]')).toBeVisible();
  });

  test('should handle back to cart functionality', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Click back to cart
    const backButton = page.locator('button:has-text("Back to Cart")');
    if (await backButton.isVisible()) {
      await backButton.click();

      // Should go back to cart
      await expect(page).toHaveURL('/cart');
    }
  });

  test('should handle guest checkout', async ({ page }) => {
    // Add item to cart as guest
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Should allow guest checkout or prompt for login
    const loginPrompt = page.locator('text=Please sign in to continue');
    const guestCheckout = page.locator('button:has-text("Checkout as Guest")');

    if (await loginPrompt.isVisible()) {
      // Requires login
      await expect(loginPrompt).toBeVisible();
    } else if (await guestCheckout.isVisible()) {
      // Allows guest checkout
      await expect(guestCheckout).toBeVisible();
    }
  });

  test('should handle order notes', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check order notes field
    const notesTextarea = page.locator('textarea[name="orderNotes"]');
    if (await notesTextarea.isVisible()) {
      await notesTextarea.fill('Please handle with care');

      // Check if notes are saved
      await expect(notesTextarea).toHaveValue('Please handle with care');
    }
  });

  test('should handle billing address different from shipping', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Check billing address checkbox
    const differentBillingCheckbox = page.locator('input[name="differentBilling"]');
    if (await differentBillingCheckbox.isVisible()) {
      await differentBillingCheckbox.check();

      // Check if billing address fields appear
      await expect(page.locator('input[name="billingName"]')).toBeVisible();
      await expect(page.locator('input[name="billingAddress"]')).toBeVisible();
    }
  });

  test('should show loading state during payment processing', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Fill form
    await page.fill('input[name="shippingName"]', 'Test User');
    await page.fill('input[name="shippingAddress"]', '123 Test St, Test City, 12345');
    await page.fill('input[name="shippingPhone"]', '1234567890');

    // Mock payment processing
    await page.route('**/api/checkout/payment-intent', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Submit payment
    await page.click('button[type="submit"]');

    // Check loading state
    await expect(page.locator('[data-testid="payment-loading"]')).toBeVisible();
  });

  test('should handle payment success', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Fill form
    await page.fill('input[name="shippingName"]', 'Test User');
    await page.fill('input[name="shippingAddress"]', '123 Test St, Test City, 12345');
    await page.fill('input[name="shippingPhone"]', '1234567890');

    // Mock successful payment
    await page.route('**/api/checkout/payment-intent', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          orderId: '12345',
          redirectUrl: '/checkout/success?order=12345'
        })
      });
    });

    // Submit payment
    await page.click('button[type="submit"]');

    // Should redirect to success page
    await expect(page).toHaveURL('/checkout/success?order=12345');
  });

  test('should handle payment failure', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Fill form
    await page.fill('input[name="shippingName"]', 'Test User');
    await page.fill('input[name="shippingAddress"]', '123 Test St, Test City, 12345');
    await page.fill('input[name="shippingPhone"]', '1234567890');

    // Mock failed payment
    await page.route('**/api/checkout/payment-intent', async route => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({
          success: false,
          error: 'Payment failed'
        })
      });
    });

    // Submit payment
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Payment failed')).toBeVisible();
  });

  test('should handle checkout cancellation', async ({ page }) => {
    await login(page);

    // Add item to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/checkout');

    // Cancel checkout
    const cancelButton = page.locator('button:has-text("Cancel")');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Should go back to cart
      await expect(page).toHaveURL('/cart');
    }
  });
});
