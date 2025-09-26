# Playwright Test Suite for FarmMart

This directory contains comprehensive end-to-end and API tests for the FarmMart e-commerce application using Playwright.

## Test Structure

### Test Files

- `auth.spec.ts` - Authentication tests (signin, signup, logout, validation)
- `products.spec.ts` - Product browsing, searching, filtering, and interaction tests
- `cart.spec.ts` - Shopping cart functionality tests
- `checkout.spec.ts` - Checkout process and payment tests
- `orders.spec.ts` - Order management and history tests
- `profile.spec.ts` - User profile management tests
- `notifications.spec.ts` - Notification system tests
- `api.spec.ts` - API endpoint tests
- `test-utils.ts` - Shared utilities and helper functions

### Test Categories

#### End-to-End Tests (UI)
- **Authentication**: Login, signup, password reset, social login
- **Product Management**: Browsing, searching, filtering, sorting, product details
- **Cart Operations**: Add/remove items, quantity updates, cart persistence
- **Checkout Flow**: Shipping, payment, order confirmation
- **Order Management**: Order history, tracking, returns, reordering
- **User Profile**: Profile editing, preferences, account management
- **Notifications**: Real-time notifications, preferences, management

#### API Tests
- **RESTful Endpoints**: CRUD operations for all resources
- **Authentication**: JWT tokens, protected routes
- **Data Validation**: Request/response validation
- **Error Handling**: Status codes, error messages
- **Rate Limiting**: API throttling
- **CORS**: Cross-origin resource sharing

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

3. Start the development server:
```bash
npm run dev
```

### Running All Tests

```bash
npx playwright test
```

### Running Specific Test Files

```bash
# Run authentication tests
npx playwright test auth.spec.ts

# Run product tests
npx playwright test products.spec.ts

# Run API tests
npx playwright test api.spec.ts
```

### Running Tests in Specific Browsers

```bash
# Run in Chromium only
npx playwright test --project=chromium

# Run in Firefox only
npx playwright test --project=firefox

# Run in WebKit only
npx playwright test --project=webkit
```

### Running Tests with UI Mode

```bash
npx playwright test --ui
```

### Running Tests in Headed Mode (visible browser)

```bash
npx playwright test --headed
```

### Running Tests in Debug Mode

```bash
npx playwright test --debug
```

### Generating Test Reports

```bash
npx playwright show-report
```

## Test Configuration

The test configuration is defined in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Test Directory**: `./tests`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Parallel Execution**: Fully parallel across all projects
- **Retries**: 2 retries on CI, 0 in development
- **Auto-start Server**: Development server starts automatically

## Test Data

### Test User Credentials

```javascript
{
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  phone: '1234567890',
  address: '123 Test Street, Test City, 12345'
}
```

### Test Utilities

The `test-utils.ts` file provides helper functions:

- `login(page)` - Authenticate a test user
- `signup(page)` - Create a new test user
- `clearCart(page)` - Empty the shopping cart
- `apiRequest(endpoint)` - Make API requests
- `getAuthToken(page)` - Extract authentication token

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { login } from './test-utils';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup code runs before each test
    await page.context().clearCookies();
  });

  test('should perform action', async ({ page }) => {
    // Test implementation
    await login(page);
    await page.goto('/some-page');

    // Assertions
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### API Test Structure

```typescript
test('should test API endpoint', async () => {
  const response = await apiRequest('/api/endpoint');
  expect(response.status).toBe(200);

  const data = await response.json();
  expect(data).toHaveProperty('property');
});
```

## Best Practices

### Test Organization
- Group related tests in `test.describe()` blocks
- Use descriptive test names starting with "should"
- Keep tests focused on a single functionality
- Use `beforeEach` for common setup code

### Selectors
- Prefer data-testid attributes for reliable element selection
- Use semantic selectors when data-testid is not available
- Avoid CSS classes that might change with styling updates

### Assertions
- Use specific assertions (`toBeVisible()`, `toContainText()`, etc.)
- Test both positive and negative scenarios
- Verify user-visible behavior, not implementation details

### Test Data
- Use unique test data to avoid conflicts between tests
- Clean up test data when possible
- Don't rely on production data

### Error Handling
- Test error states and validation messages
- Verify proper error handling for edge cases
- Test network failures and timeouts

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Common Issues

1. **Tests failing due to timing issues**
   - Add `await page.waitForTimeout(1000)` for dynamic content
   - Use `await page.waitForSelector()` for elements that load asynchronously

2. **Authentication issues**
   - Ensure test user exists in the database
   - Clear cookies/localStorage between tests
   - Check token expiration

3. **API tests failing**
   - Verify API endpoints are running
   - Check authentication tokens
   - Validate request/response formats

4. **Browser-specific failures**
   - Test in multiple browsers to identify browser-specific issues
   - Use conditional logic for browser-specific behavior

### Debugging Tips

- Use `--debug` flag to step through tests
- Add `await page.pause()` to inspect the page state
- Use `console.log()` for debugging test logic
- Check browser console for JavaScript errors

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Add appropriate test descriptions
3. Include both positive and negative test cases
4. Update this README if adding new test categories
5. Ensure tests pass in all supported browsers

## Test Coverage

The test suite covers:

- ✅ User authentication and authorization
- ✅ Product browsing and management
- ✅ Shopping cart functionality
- ✅ Checkout and payment processing
- ✅ Order management and tracking
- ✅ User profile management
- ✅ Notification system
- ✅ API endpoints and data validation
- ✅ Error handling and edge cases
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness

## Performance Testing

For performance testing, consider:

- Load testing with multiple concurrent users
- API response time validation
- Page load performance metrics
- Memory usage monitoring

## Security Testing

Security-focused tests should include:

- Input validation and sanitization
- Authentication bypass attempts
- SQL injection prevention
- XSS vulnerability testing
- CSRF protection validation
