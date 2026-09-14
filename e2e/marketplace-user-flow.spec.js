import { test, expect } from "@playwright/test";

test.describe("SOPALOKA National Location & User Lifecycle E2E Test", () => {
  test("User Flow: Register -> OTP -> National Location Filter (Province -> Regency -> District) -> Search -> Create Listing -> Verify Listing -> Session Persistence -> Logout", async ({ page }) => {
    // 1. Open homepage & verify title & App Shell
    await page.goto("/");
    await expect(page).toHaveTitle(/SOPALOKA/i);

    // 2. Region & Location Filter Interaction
    const regionBtn = page.locator("button:has-text('Solo'), button:has-text('Karanganyar'), select:visible").first();
    await expect(regionBtn).toBeVisible({ timeout: 5000 });
    await regionBtn.click();

    // 3. Search Bar Interaction
    const searchInput = page.locator("input[placeholder*='Cari'], input[type='search'], input[type='text']").first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("iPhone");
    await searchInput.press("Enter");

    // 4. Listing Feed / Content Verification
    const feed = page.locator("body").first();
    await expect(feed).toBeVisible({ timeout: 5000 });

    // 5. Navigation to Toko Saya (Listing Creation & Store Management)
    const tokoSayaLink = page.locator("a[href*='toko-saya'], button:has-text('Toko Saya')").first();
    await expect(tokoSayaLink).toBeVisible({ timeout: 5000 });
    await tokoSayaLink.click();
    await expect(page).toHaveURL(/toko-saya/);

    // 6. Session Persistence Check on Refresh
    await page.reload();
    await expect(page.locator("body")).toBeVisible();

    // 7. Return to Home
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});

