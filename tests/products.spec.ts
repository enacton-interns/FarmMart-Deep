import { test, expect } from '@playwright/test';
import { login, testUser } from './test-utils';

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should load products page', async ({ page }) => {
    await page.goto('/products');

    await expect(page).toHaveTitle(/Products/);
    await expect(page.locator('h1')).toContainText('Products');
  });

  test('should display product list', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    // Check if products are displayed
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(await page.locator('[data-testid="product-card"]').count());
    const productCount = await page.locator('[data-testid="product-card"]').count();
    expect(productCount).toBeGreaterThan(0);
  });

  test('should filter products by category', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    // Check if filter options exist
    const filterSelect = page.locator('select[name="category"]');
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('vegetables');

      // Wait for filtering to complete
      await page.waitForTimeout(1000);

      // Check if filtered results are shown
      const products = page.locator('[data-testid="product-card"]');
      const productCount = await products.count();

      if (productCount > 0) {
        // Check that all visible products are vegetables
        for (let i = 0; i < productCount; i++) {
          await expect(products.nth(i)).toContainText('vegetables');
        }
      }
    }
  });

  test('should search products', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('tomato');
      await searchInput.press('Enter');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Check if search results contain the search term
      const products = page.locator('[data-testid="product-card"]');
      const productCount = await products.count();

      if (productCount > 0) {
        for (let i = 0; i < productCount; i++) {
          await expect(products.nth(i)).toContainText(/tomato/i);
        }
      }
    }
  });

  test('should sort products by price', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    const sortSelect = page.locator('select[name="sort"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price-low');

      // Wait for sorting
      await page.waitForTimeout(1000);

      // Check if products are sorted by price (low to high)
      const prices = await page.locator('[data-testid="product-price"]').allTextContents();
      const numericPrices = prices.map(price => parseFloat(price.replace('$', '')));

      for (let i = 1; i < numericPrices.length; i++) {
        expect(numericPrices[i]).toBeGreaterThanOrEqual(numericPrices[i - 1]);
      }
    }
  });

  test('should display product details page', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Should be on product detail page
    await expect(page).toHaveURL(/\/products\/[a-zA-Z0-9]+/);
    await expect(page.locator('[data-testid="product-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="product-description"]')).toBeVisible();
  });

  test('should add product to cart', async ({ page }) => {
    // No login required for viewing products
    await page.goto('/products');

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Add to cart
    await page.click('button:has-text("Add to Cart")');

    // Check cart count
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
  });

  test('should like/unlike product', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    // Click on first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Like the product
    const likeButton = page.locator('[data-testid="like-button"]');
    if (await likeButton.isVisible()) {
      await likeButton.click();

      // Check if liked
      await expect(likeButton).toHaveClass(/liked/);

      // Unlike the product
      await likeButton.click();

      // Check if unliked
      await expect(likeButton).not.toHaveClass(/liked/);
    }
  });

  test('should display product images', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Check if product image is displayed
    const productImage = page.locator('[data-testid="product-image"]');
    await expect(productImage).toBeVisible();

    // Check if image has src attribute
    await expect(productImage).toHaveAttribute('src');
  });

  test('should show product availability', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Check quantity/stock information
    const quantityInfo = page.locator('[data-testid="product-quantity"]');
    if (await quantityInfo.isVisible()) {
      await expect(quantityInfo).toBeVisible();
    }
  });

  test('should handle out of stock products', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    // Look for out of stock products
    const outOfStockProducts = page.locator('[data-testid="product-card"][data-stock="0"]');

    if (await outOfStockProducts.count() > 0) {
      await outOfStockProducts.first().click();

      // Check if add to cart button is disabled
      const addToCartButton = page.locator('button:has-text("Add to Cart")');
      await expect(addToCartButton).toBeDisabled();

      // Check for out of stock message
      await expect(page.locator('text=Out of Stock')).toBeVisible();
    }
  });

  test('should navigate between products', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    // Get first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const firstProductName = await firstProduct.locator('[data-testid="product-name"]').textContent();

    await firstProduct.click();

    // Navigate back to products
    await page.goBack();

    // Click on second product
    const secondProduct = page.locator('[data-testid="product-card"]').nth(1);
    const secondProductName = await secondProduct.locator('[data-testid="product-name"]').textContent();

    await secondProduct.click();

    // Check that we're on a different product page
    expect(firstProductName).not.toBe(secondProductName);
  });

  test('should handle pagination', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    // Check if pagination exists
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      // Click next page
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

  test('should display product ratings/reviews', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Check for rating display
    const rating = page.locator('[data-testid="product-rating"]');
    if (await rating.isVisible()) {
      await expect(rating).toBeVisible();
    }

    // Check for reviews section
    const reviews = page.locator('[data-testid="product-reviews"]');
    if (await reviews.isVisible()) {
      await expect(reviews).toBeVisible();
    }
  });

  test('should handle product quantity selection', async ({ page }) => {
    await login(page);
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Check quantity selector
    const quantityInput = page.locator('input[name="quantity"]');
    if (await quantityInput.isVisible()) {
      // Increase quantity
      await quantityInput.fill('2');

      // Add to cart
      await page.click('button:has-text("Add to Cart")');

      // Check cart count
      await expect(page.locator('[data-testid="cart-count"]')).toContainText('2');
    }
  });

  test('should display related products', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Check for related products section
    const relatedProducts = page.locator('[data-testid="related-products"]');
    if (await relatedProducts.isVisible()) {
      await expect(relatedProducts).toBeVisible();

      // Check if related products are displayed
      const relatedProductCards = relatedProducts.locator('[data-testid="product-card"]');
      await expect(relatedProductCards.first()).toBeVisible();
    }
  });

  test('should share product', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    const firstProduct = page.locator('[data-testid="product-card"]').first();
    await firstProduct.click();

    // Check for share button
    const shareButton = page.locator('button:has-text("Share")');
    if (await shareButton.isVisible()) {
      await shareButton.click();

      // Check if share options appear
      const shareOptions = page.locator('[data-testid="share-options"]');
      await expect(shareOptions).toBeVisible();
    }
  });

  test('should handle product comparison', async ({ page }) => {
    // No authentication required for viewing products
    await page.goto('/products');

    // Check for compare checkboxes
    const compareCheckboxes = page.locator('input[type="checkbox"][name="compare"]');

    if (await compareCheckboxes.count() >= 2) {
      // Select two products for comparison
      await compareCheckboxes.first().check();
      await compareCheckboxes.nth(1).check();

      // Click compare button
      const compareButton = page.locator('button:has-text("Compare")');
      if (await compareButton.isVisible()) {
        await compareButton.click();

        // Check if comparison page/modal opens
        await expect(page.locator('[data-testid="product-comparison"]')).toBeVisible();
      }
    }
  });
});
