import { test, expect } from "@playwright/test";
import { goToHome, waitForPageLoad } from "./helpers";

test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    await goToHome(page);

    // Check page title
    await expect(page).toHaveTitle(/Fandry/);
  });

  test("should display header with navigation", async ({ page }) => {
    await goToHome(page);

    // Header should be visible
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Logo/brand should be visible
    const logo = page.getByText("Fandry").first();
    await expect(logo).toBeVisible();
  });

  test("should have search functionality", async ({ page }) => {
    await goToHome(page);

    // Look for search input or button
    const searchButton = page.getByRole("button", { name: /検索|search/i });
    const searchInput = page.getByPlaceholder(/検索|search/i);

    // At least one should exist
    const hasSearch = await searchButton.isVisible().catch(() => false) ||
                      await searchInput.isVisible().catch(() => false);

    expect(hasSearch).toBe(true);
  });

  test("should navigate to discover page", async ({ page }) => {
    await goToHome(page);

    // Click on discover link
    const discoverLink = page.getByRole("link", { name: /見つける|discover|探す/i }).first();

    if (await discoverLink.isVisible()) {
      await discoverLink.click();
      await waitForPageLoad(page);

      // Should be on discover page
      await expect(page).toHaveURL(/discover/);
    }
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await goToHome(page);

    // Page should still load correctly
    await expect(page).toHaveTitle(/Fandry/);

    // Header should adapt
    const header = page.locator("header");
    await expect(header).toBeVisible();
  });
});
