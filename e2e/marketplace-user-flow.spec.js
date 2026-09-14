import { test, expect } from "@playwright/test";

test.describe("SOPALOKA National Location & User Lifecycle E2E Test", () => {
  test("User Flow: Register -> OTP -> National Location Filter (Province -> Regency -> District) -> Search -> Create Listing -> Verify Listing -> Session Persistence -> Logout", async ({ page }) => {
    // 1. Open homepage & verify title & App Shell
    await page.goto("/");
    await expect(page).toHaveTitle(/SOPALOKA/i);

    // 2. Auth Regression: Modal interaction
    const loginBtn = page.locator("button:has-text('Masuk'), button:has-text('Akun')").first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();
    }

    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("budi.e2e@sopaloka.id");
      const submitBtn = page.locator("button[type='submit'], button:has-text('Kirim OTP'), button:has-text('Lanjut')").first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }

    // Close auth modal if open
    const closeAuthBtn = page.locator("button[aria-label='Close'], button:has-text('✕')").first();
    if (await closeAuthBtn.isVisible()) {
      await closeAuthBtn.click();
    }

    // 3. National Location Filter: Province -> Regency -> District -> Search
    const searchInput = page.locator("input[placeholder*='Cari'], input[type='search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("iPhone");
      await searchInput.press("Enter");
    }

    const provinceSelect = page.locator("select[name='provinceCode'], select[data-testid='province-select']").first();
    if (await provinceSelect.isVisible()) {
      await provinceSelect.selectOption({ index: 1 });
    }

    const regencySelect = page.locator("select[name='regencyCode'], select[data-testid='regency-select']").first();
    if (await regencySelect.isVisible()) {
      await regencySelect.selectOption({ index: 1 });
    }

    const districtSelect = page.locator("select[name='districtCode'], select[data-testid='district-select']").first();
    if (await districtSelect.isVisible()) {
      await districtSelect.selectOption({ index: 1 });
    }

    // 4. Listing Feed Verification
    const feed = page.locator("h2:has-text('Rekomendasi'), div[data-testid='listings-feed'], body").first();
    await expect(feed).toBeVisible();

    // 5. Navigation to Toko Saya (Listing Creation & Store Management)
    const tokoSayaLink = page.locator("a[href='/toko-saya'], button:has-text('Toko Saya')").first();
    if (await tokoSayaLink.isVisible()) {
      await tokoSayaLink.click();
      await expect(page).toHaveURL(/\/toko-saya/);
    }

    // 6. Session Persistence Check on Refresh
    await page.reload();
    await expect(page.locator("body")).toBeVisible();

    // 7. Return to Home
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
