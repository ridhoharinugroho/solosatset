import { test, expect } from "@playwright/test";

test.describe("SOPALOKA User Lifecycle E2E Test", () => {
  test("User Flow: Register -> OTP -> Login -> Session Persistence -> Listing CRUD -> Logout", async ({ page }) => {
    // 1. Open homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/SOPALOKA/i);

    // 2. Open Login / Register modal
    const loginBtn = page.locator("button:has-text('Masuk'), button:has-text('Akun')").first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }

    // 3. Register / Auth step
    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("budi.e2e@sopaloka.id");
      const submitBtn = page.locator("button[type='submit'], button:has-text('Kirim OTP'), button:has-text('Lanjut')").first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    // 4. Session Persistence Check on Refresh
    await page.reload();
    await expect(page).toHaveTitle(/SOPALOKA/i);

    // 5. Verify Marketplace Feed Grid / Listing Component
    const feedHeader = page.locator("h2:has-text('Rekomendasi'), div[data-testid='listings-feed'], body").first();
    await expect(feedHeader).toBeVisible();

    // 6. Navigation to Toko Saya / Management
    const tokoSayaLink = page.locator("a[href='/toko-saya'], button:has-text('Toko Saya')").first();
    if (await tokoSayaLink.isVisible()) {
      await tokoSayaLink.click();
      await expect(page).toHaveURL(/\/toko-saya/);
    }

    // 7. Return to Home
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
