import { Page } from '@playwright/test';

// Test user credentials
export const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '1234567890',
  address: '123 Test Street, Test City, 12345'
};

// Test product data
export const testProduct = {
  name: 'Test Product',
  description: 'A test product for automation testing',
  price: 29.99,
  category: 'vegetables',
  quantity: 100,
  image: 'https://example.com/test-image.jpg'
};

// Helper functions
export async function login(page: Page, email: string = testUser.email, password: string = testUser.password) {
  await page.goto('/auth/signin');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/'); // Wait for redirect to home
}

export async function signup(page: Page, user = testUser) {
  await page.goto('/auth/signup');
  await page.fill('input[placeholder="John Doe"]', user.name);
  await page.fill('input[placeholder*="john@example.com"]', user.email);
  await page.fill('input[placeholder*="••••••••"]', user.password);
  await page.fill('input[placeholder*="Confirm Password"]', user.password);
  // Select Customer role (default)
  await page.selectOption('select', 'Customer');
  await page.fill('input[placeholder*="123 Main St"]', user.address);
  await page.fill('input[placeholder*="Phone Number"]', user.phone);
  // Check terms agreement
  await page.check('input[type="checkbox"]');
  await page.click('button:has-text("Create Account")');
  await page.waitForURL('/'); // Wait for redirect to home
}

export async function logout(page: Page) {
  // Click on profile dropdown or logout button
  await page.click('[data-testid="profile-menu"]');
  await page.click('text=Logout');
  await page.waitForURL('/auth/signin');
}

export async function addToCart(page: Page, productId: string) {
  await page.goto(`/products/${productId}`);
  await page.click('button:has-text("Add to Cart")');
  // Wait for cart update
  await page.waitForSelector('[data-testid="cart-count"]');
}

export async function clearCart(page: Page) {
  await page.goto('/cart');
  const removeButtons = await page.locator('button:has-text("Remove")').all();
  for (const button of removeButtons) {
    await button.click();
  }
}

export async function seedDatabase() {
  // This would call the seed API endpoint
  const response = await fetch('http://localhost:3000/api/seed', {
    method: 'POST',
  });
  return response.ok;
}

export async function waitForLoading(page: Page) {
  await page.waitForSelector('[data-testid="loading"]', { state: 'detached' });
}

export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `tests/screenshots/${name}.png` });
}

// API testing helpers
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const baseURL = 'http://localhost:3000';
  const url = `${baseURL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  return response;
}

export async function getAuthToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const tokenCookie = cookies.find((cookie) => cookie.name === 'token');
  return tokenCookie?.value ?? null;
}
