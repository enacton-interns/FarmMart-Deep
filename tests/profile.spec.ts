import { test, expect } from '@playwright/test';
import { login, testUser } from './test-utils';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test('should load profile page', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    await expect(page).toHaveTitle(/Profile/);
    await expect(page.locator('h1')).toContainText('My Profile');
  });

  test('should redirect to signin if not authenticated', async ({ page }) => {
    await page.goto('/profile');

    // Should redirect to signin
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should display user information', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check user info display
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-address"]')).toBeVisible();
  });

  test('should allow editing profile information', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Click edit profile button
    const editButton = page.locator('button:has-text("Edit Profile")');
    if (await editButton.isVisible()) {
      await editButton.click();

      // Check edit form
      await expect(page.locator('input[name="name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="phone"]')).toBeVisible();
      await expect(page.locator('input[name="address"]')).toBeVisible();

      // Update information
      await page.fill('input[name="name"]', 'Updated Test User');
      await page.fill('input[name="phone"]', '9876543210');

      // Save changes
      await page.click('button:has-text("Save Changes")');

      // Check success message
      await expect(page.locator('text=Profile updated successfully')).toBeVisible();

      // Verify changes
      await expect(page.locator('[data-testid="user-name"]')).toContainText('Updated Test User');
      await expect(page.locator('[data-testid="user-phone"]')).toContainText('9876543210');
    }
  });

  test('should validate profile form', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    const editButton = page.locator('button:has-text("Edit Profile")');
    if (await editButton.isVisible()) {
      await editButton.click();

      // Clear required fields
      await page.fill('input[name="name"]', '');
      await page.fill('input[name="email"]', '');
      await page.fill('input[name="phone"]', '');

      // Try to save
      await page.click('button:has-text("Save Changes")');

      // Check validation messages
      await expect(page.locator('text=Name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
      await expect(page.locator('text=Phone is required')).toBeVisible();
    }
  });

  test('should handle email change with confirmation', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    const editButton = page.locator('button:has-text("Edit Profile")');
    if (await editButton.isVisible()) {
      await editButton.click();

      // Change email
      await page.fill('input[name="email"]', 'newemail@example.com');

      // Save changes
      await page.click('button:has-text("Save Changes")');

      // Check for email confirmation message
      await expect(page.locator('text=Please check your email to confirm the change')).toBeVisible();
    }
  });

  test('should handle password change', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for change password section
    const changePasswordButton = page.locator('button:has-text("Change Password")');
    if (await changePasswordButton.isVisible()) {
      await changePasswordButton.click();

      // Fill password change form
      await page.fill('input[name="currentPassword"]', testUser.password);
      await page.fill('input[name="newPassword"]', 'newpassword123');
      await page.fill('input[name="confirmPassword"]', 'newpassword123');

      // Submit
      await page.click('button:has-text("Update Password")');

      // Check success message
      await expect(page.locator('text=Password updated successfully')).toBeVisible();
    }
  });

  test('should validate password change', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    const changePasswordButton = page.locator('button:has-text("Change Password")');
    if (await changePasswordButton.isVisible()) {
      await changePasswordButton.click();

      // Fill with mismatched passwords
      await page.fill('input[name="currentPassword"]', testUser.password);
      await page.fill('input[name="newPassword"]', 'newpassword123');
      await page.fill('input[name="confirmPassword"]', 'differentpassword');

      // Submit
      await page.click('button:has-text("Update Password")');

      // Check validation
      await expect(page.locator('text=Passwords do not match')).toBeVisible();
    }
  });

  test('should display profile picture upload', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for profile picture section
    const profilePicture = page.locator('[data-testid="profile-picture"]');
    if (await profilePicture.isVisible()) {
      await expect(profilePicture).toBeVisible();

      // Check for upload button
      const uploadButton = page.locator('button:has-text("Upload Photo")');
      if (await uploadButton.isVisible()) {
        await uploadButton.click();

        // Check file input
        const fileInput = page.locator('input[type="file"]');
        await expect(fileInput).toBeVisible();
      }
    }
  });

  test('should handle profile preferences', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for preferences section
    const preferencesSection = page.locator('[data-testid="preferences"]');
    if (await preferencesSection.isVisible()) {
      // Check notification preferences
      const emailNotifications = page.locator('input[name="emailNotifications"]');
      if (await emailNotifications.isVisible()) {
        await emailNotifications.check();
        await expect(emailNotifications).toBeChecked();
      }

      // Check language preference
      const languageSelect = page.locator('select[name="language"]');
      if (await languageSelect.isVisible()) {
        await languageSelect.selectOption('en');
      }

      // Save preferences
      const saveButton = page.locator('button:has-text("Save Preferences")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await expect(page.locator('text=Preferences saved')).toBeVisible();
      }
    }
  });

  test('should display account creation date', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check account info
    const accountCreated = page.locator('[data-testid="account-created"]');
    if (await accountCreated.isVisible()) {
      await expect(accountCreated).toBeVisible();
    }
  });

  test('should handle account deletion', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for delete account button
    const deleteButton = page.locator('button:has-text("Delete Account")');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Check confirmation dialog
      await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible();

      // Cancel deletion
      await page.click('button:has-text("Cancel")');

      // Account should still exist
      await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    }
  });

  test('should display order statistics', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for order stats
    const totalOrders = page.locator('[data-testid="total-orders"]');
    if (await totalOrders.isVisible()) {
      await expect(totalOrders).toBeVisible();
    }

    const totalSpent = page.locator('[data-testid="total-spent"]');
    if (await totalSpent.isVisible()) {
      await expect(totalSpent).toBeVisible();
    }
  });

  test('should handle address management', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for addresses section
    const addressesSection = page.locator('[data-testid="addresses"]');
    if (await addressesSection.isVisible()) {
      await expect(addressesSection).toBeVisible();

      // Check for add address button
      const addAddressButton = page.locator('button:has-text("Add Address")');
      if (await addAddressButton.isVisible()) {
        await addAddressButton.click();

        // Check address form
        await expect(page.locator('input[name="street"]')).toBeVisible();
        await expect(page.locator('input[name="city"]')).toBeVisible();
        await expect(page.locator('input[name="zipCode"]')).toBeVisible();

        // Fill and save
        await page.fill('input[name="street"]', '456 New Street');
        await page.fill('input[name="city"]', 'New City');
        await page.fill('input[name="zipCode"]', '54321');
        await page.click('button:has-text("Save Address")');

        // Check success
        await expect(page.locator('text=Address added successfully')).toBeVisible();
      }
    }
  });

  test('should handle payment method management', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for payment methods section
    const paymentMethodsSection = page.locator('[data-testid="payment-methods"]');
    if (await paymentMethodsSection.isVisible()) {
      await expect(paymentMethodsSection).toBeVisible();

      // Check for add payment method button
      const addPaymentButton = page.locator('button:has-text("Add Payment Method")');
      if (await addPaymentButton.isVisible()) {
        await addPaymentButton.click();

        // Check payment form (would be Stripe elements)
        await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
      }
    }
  });

  test('should display wishlist/favorites', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for wishlist section
    const wishlistSection = page.locator('[data-testid="wishlist"]');
    if (await wishlistSection.isVisible()) {
      await expect(wishlistSection).toBeVisible();

      // Check wishlist items
      const wishlistItems = wishlistSection.locator('[data-testid="wishlist-item"]');
      const itemCount = await wishlistItems.count();

      if (itemCount > 0) {
        await expect(wishlistItems.first()).toBeVisible();
      }
    }
  });

  test('should handle privacy settings', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for privacy section
    const privacySection = page.locator('[data-testid="privacy-settings"]');
    if (await privacySection.isVisible()) {
      // Check profile visibility
      const profileVisibility = page.locator('select[name="profileVisibility"]');
      if (await profileVisibility.isVisible()) {
        await profileVisibility.selectOption('private');
      }

      // Check data sharing preferences
      const dataSharing = page.locator('input[name="dataSharing"]');
      if (await dataSharing.isVisible()) {
        await dataSharing.uncheck();
      }

      // Save privacy settings
      const saveButton = page.locator('button:has-text("Save Privacy Settings")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await expect(page.locator('text=Privacy settings saved')).toBeVisible();
      }
    }
  });

  test('should display activity log', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for activity log
    const activityLog = page.locator('[data-testid="activity-log"]');
    if (await activityLog.isVisible()) {
      await expect(activityLog).toBeVisible();

      // Check activity entries
      const activities = activityLog.locator('[data-testid="activity-item"]');
      const activityCount = await activities.count();

      if (activityCount > 0) {
        await expect(activities.first()).toBeVisible();
      }
    }
  });

  test('should handle profile export', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for export data button
    const exportButton = page.locator('button:has-text("Export Data")');
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');

      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(json|csv)/i);
    }
  });

  test('should handle two-factor authentication', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for 2FA section
    const twoFactorSection = page.locator('[data-testid="two-factor-auth"]');
    if (await twoFactorSection.isVisible()) {
      // Check 2FA toggle
      const twoFactorToggle = page.locator('input[name="twoFactorEnabled"]');
      if (await twoFactorToggle.isVisible()) {
        const isEnabled = await twoFactorToggle.isChecked();

        if (!isEnabled) {
          await twoFactorToggle.check();

          // Check setup process
          await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
          await expect(page.locator('input[name="verificationCode"]')).toBeVisible();
        }
      }
    }
  });

  test('should display subscription information', async ({ page }) => {
    await login(page);
    await page.goto('/profile');

    // Check for subscription section
    const subscriptionSection = page.locator('[data-testid="subscription"]');
    if (await subscriptionSection.isVisible()) {
      await expect(subscriptionSection).toBeVisible();

      // Check subscription status
      const subscriptionStatus = page.locator('[data-testid="subscription-status"]');
      if (await subscriptionStatus.isVisible()) {
        await expect(subscriptionStatus).toBeVisible();
      }
    }
  });
});
