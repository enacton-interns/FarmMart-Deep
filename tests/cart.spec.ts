import { test, expect } from '@playwright/test';
import { login, clearCart } from './test-utils';

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should load cart page', async ({ page }) => {
    await page.goto('/cart');

    await expect(page).toHaveTitle(/Cart/);
    await expect(page.locator('h1')).toContainText('Shopping Cart');
  });

  test('should display empty cart message', async ({ page }) => {
    await page.goto('/cart');

    // Check for empty cart message
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });

  test('should add product to cart from products page', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productName = await firstProduct.locator('[data-testid="product-name"]').textContent();
    const productPrice = await firstProduct.locator('[data-testid="product-price"]').textContent();

    await firstProduct.click();

    // Add to cart
    await page.click('button:has-text("Add to Cart")');

    // Go to cart
    await page.goto('/cart');

    // Check if product is in cart
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="cart-item-name"]')).toContainText(productName || '');
    await expect(page.locator('[data-testid="cart-item-price"]')).toContainText(productPrice || '');
  });

  test('should update cart quantity', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    // Go to cart
    await page.goto('/cart');

    // Update quantity
    const quantityInput = page.locator('input[name="quantity"]');
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('3');

      // Wait for update
      await page.waitForTimeout(1000);

      // Check total price calculation
      const itemPrice = await page.locator('[data-testid="cart-item-price"]').textContent();
      const totalPrice = await page.locator('[data-testid="cart-total"]').textContent();

      if (itemPrice && totalPrice) {
        const price = parseFloat(itemPrice.replace('$', ''));
        const total = parseFloat(totalPrice.replace('$', ''));
        expect(total).toBe(price * 3);
      }
    }
  });

  test('should remove item from cart', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    // Go to cart
    await page.goto('/cart');

    // Remove item
    await page.click('button:has-text("Remove")');

    // Check if cart is empty
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
  });

  test('should calculate cart total correctly', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    // Add multiple products to cart
    const products = page.locator('[data-testid="product-card"]');

    if (await products.count() >= 2) {
      // Add first product
      await products.first().click();
      await page.click('button:has-text("Add to Cart")');
      await page.goBack();

      // Add second product
      await products.nth(1).click();
      await page.click('button:has-text("Add to Cart")');

      // Go to cart
      await page.goto('/cart');

      // Calculate expected total
      const itemPrices = await page.locator('[data-testid="cart-item-price"]').allTextContents();
      const quantities = await page.locator('input[name="quantity"]').all();

      let expectedTotal = 0;
      for (let i = 0; i < itemPrices.length; i++) {
        const price = parseFloat(itemPrices[i].replace('$', ''));
        const quantity = parseInt(await quantities[i].getAttribute('value') || '1');
        expectedTotal += price * quantity;
      }

      // Check total
      const totalElement = page.locator('[data-testid="cart-total"]');
      const actualTotal = parseFloat((await totalElement.textContent() || '').replace('$', ''));

      expect(actualTotal).toBe(expectedTotal);
    }
  });

  test('should persist cart across sessions', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    // Refresh page
    await page.reload();

    // Check cart count persists
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // Go to cart page
    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('should handle cart drawer/sidebar', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    // Open cart drawer
    const cartButton = page.locator('[data-testid="cart-button"]');
    if (await cartButton.isVisible()) {
      await cartButton.click();

      // Check if cart drawer is open
      await expect(page.locator('[data-testid="cart-drawer"]')).toBeVisible();

      // Check cart contents in drawer
      await expect(page.locator('[data-testid="cart-drawer-item"]')).toHaveCount(1);
    }
  });

  test('should apply coupon codes', async ({ page }) => {
    await login(page);

    // Add items to cart first
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/cart');

    // Check for coupon input
    const couponInput = page.locator('input[name="coupon"]');
    if (await couponInput.isVisible()) {
      await couponInput.fill('DISCOUNT10');
      await page.click('button:has-text("Apply Coupon")');

      // Check if discount is applied
      await expect(page.locator('text=Discount applied')).toBeVisible();
    }
  });

  test('should handle shipping cost calculation', async ({ page }) => {
    await login(page);

    // Add items to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/cart');

    // Check for shipping information
    const shippingInfo = page.locator('[data-testid="shipping-cost"]');
    if (await shippingInfo.isVisible()) {
      await expect(shippingInfo).toBeVisible();

      // Check if shipping is included in total
      const subtotal = await page.locator('[data-testid="cart-subtotal"]').textContent();
      const shipping = await page.locator('[data-testid="shipping-cost"]').textContent();
      const total = await page.locator('[data-testid="cart-total"]').textContent();

      if (subtotal && shipping && total) {
        const sub = parseFloat(subtotal.replace('$', ''));
        const ship = parseFloat(shipping.replace('$', ''));
        const tot = parseFloat(total.replace('$', ''));

        expect(tot).toBe(sub + ship);
      }
    }
  });

  test('should handle minimum order requirements', async ({ page }) => {
    await page.goto('/cart');

    // Check for minimum order message
    const minOrderMessage = page.locator('text=Minimum order amount');
    if (await minOrderMessage.isVisible()) {
      await expect(minOrderMessage).toBeVisible();

      // Check if checkout button is disabled
      const checkoutButton = page.locator('button:has-text("Checkout")');
      await expect(checkoutButton).toBeDisabled();
    }
  });

  test('should save cart for later', async ({ page }) => {
    await login(page);

    // Add items to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/cart');

    // Check for save for later button
    const saveButton = page.locator('button:has-text("Save for Later")');
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Check if item moved to saved items
      await expect(page.locator('[data-testid="saved-item"]')).toBeVisible();
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(0);
    }
  });

  test('should move saved items back to cart', async ({ page }) => {
    await login(page);

    // Assuming there are saved items, move back to cart
    await page.goto('/cart');

    const moveToCartButton = page.locator('button:has-text("Move to Cart")');
    if (await moveToCartButton.isVisible()) {
      await moveToCartButton.click();

      // Check if item moved back to cart
      await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
      await expect(page.locator('[data-testid="saved-item"]')).toHaveCount(0);
    }
  });

  test('should handle cart sharing', async ({ page }) => {
    await login(page);

    // Add items to cart
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    await page.goto('/cart');

    // Check for share cart button
    const shareButton = page.locator('button:has-text("Share Cart")');
    if (await shareButton.isVisible()) {
      await shareButton.click();

      // Check if share options appear
      await expect(page.locator('[data-testid="share-cart-options"]')).toBeVisible();
    }
  });

  test('should clear entire cart', async ({ page }) => {
    await login(page);

    // Add multiple items to cart
    await page.goto('/products');
    const products = page.locator('[data-testid="product-card"]');

    for (let i = 0; i < Math.min(3, await products.count()); i++) {
      await products.nth(i).click();
      await page.click('button:has-text("Add to Cart")');
      await page.goBack();
    }

    await page.goto('/cart');

    // Clear cart
    const clearButton = page.locator('button:has-text("Clear Cart")');
    if (await clearButton.isVisible()) {
      await clearButton.click();

      // Confirm clear action
      await page.click('button:has-text("Yes, Clear Cart")');

      // Check if cart is empty
      await expect(page.locator('text=Your cart is empty')).toBeVisible();
    }
  });

  test('should handle cart persistence for guest users', async ({ page }) => {
    // Don't login - test as guest
    await page.goto('/products');

    // Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    // Refresh page
    await page.reload();

    // Check if cart persists for guest
    const cartCount = page.locator('[data-testid="cart-count"]');
    if (await cartCount.isVisible()) {
      await expect(cartCount).toContainText('1');
    }
  });

  test('should merge guest cart with user cart on login', async ({ page }) => {
    // Add item as guest
    await page.goto('/products');
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();
    await page.click('button:has-text("Add to Cart")');

    // Login
    await login(page);

    // Check if cart item is still there
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');

    // Go to cart to verify
    await page.goto('/cart');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('should handle bulk quantity updates', async ({ page }) => {
    await login(page);

    // Add multiple items to cart
    await page.goto('/products');
    const products = page.locator('[data-testid="product-card"]');

    for (let i = 0; i < Math.min(3, await products.count()); i++) {
      await products.nth(i).click();
      await page.click('button:has-text("Add to Cart")');
      await page.goBack();
    }

    await page.goto('/cart');

    // Update all quantities at once
    const quantityInputs = page.locator('input[name="quantity"]');
    const count = await quantityInputs.count();

    for (let i = 0; i < count; i++) {
      await quantityInputs.nth(i).fill('2');
    }

    // Apply bulk update
    const updateButton = page.locator('button:has-text("Update Cart")');
    if (await updateButton.isVisible()) {
      await updateButton.click();

      // Check if all quantities updated
      const updatedQuantities = await quantityInputs.all();
      for (const input of updatedQuantities) {
        expect(await input.getAttribute('value')).toBe('2');
      }
    }
  });
});
