import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('Admin login successful', async ({ page }) => {
    await page.goto('/');
    
    // Select Admin Role first
    await page.click('button:has-text("Admin")');

    // Fill in credentials using placeholders since the inputs lack "name" attributes
    await page.fill('input[placeholder="Enter admin email"]', 'admin@iitrpr.ac.in'); 
    await page.fill('input[placeholder="Enter admin password"]', 'admin_password');
    // Using type="submit" avoids clicking the Google Sign In button!
    await page.click('button[type="submit"]');
  });

  test('Student login successful', async ({ page }) => {
    await page.goto('/');
    
    // Select Student Role first
    await page.click('button:has-text("Student")');

    // Fill in student credentials
    await page.fill('input[placeholder="e.g. 2023CSB1107"]', '2020CSB1001');
    await page.fill('input[placeholder="Enter your password"]', 'student_password');
    // Important: Use type="submit" to avoid clicking 'Sign in with Google'
    await page.click('button[type="submit"]');
  });

  test('Shows error on invalid credentials', async ({ page }) => {
    await page.goto('/');
    
    // Select Student Role
    await page.click('button:has-text("Student")');

    // Fill in wrong credentials
    await page.fill('input[placeholder="e.g. 2023CSB1107"]', 'INVALID_USER123');
    await page.fill('input[placeholder="Enter your password"]', 'wrongpassword');
    // Important: Use type="submit" to avoid clicking 'Sign in with Google'
    await page.click('button[type="submit"]');

    // Verify error message appears
    await expect(page.locator('text=Invalid entry number or password')).toBeVisible();
  });
});
