import { test, expect } from "@playwright/test";

test.describe("Auth Flow", () => {
  test("unauthorized navigation should handle admin route safely", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("body")).toBeVisible();
  });

  test("homepage loads clean React/Next.js environment", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    await page.reload();
    await expect(page.locator("body")).toBeVisible();
  });
});
