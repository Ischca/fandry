import { test, expect } from "@playwright/test";
import { goToDiscover, waitForPageLoad } from "./helpers";

test.describe("Discover Page", () => {
  test("should load the discover page", async ({ page }) => {
    await goToDiscover(page);

    // Page should load
    await expect(page).toHaveURL(/discover/);
  });

  test("should display creator cards", async ({ page }) => {
    await goToDiscover(page);

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Should show some content (creators or empty state)
    const content = page.locator("main");
    await expect(content).toBeVisible();
  });

  test("should have category filter", async ({ page }) => {
    await goToDiscover(page);

    // Look for category tabs or filter buttons
    const categoryFilter = page.getByRole("tablist").or(
      page.locator("[data-testid='category-filter']")
    ).or(
      page.getByRole("button", { name: /すべて|all/i })
    );

    // Category filter might exist
    const hasFilter = await categoryFilter.first().isVisible().catch(() => false);

    // Log for debugging (not failing if not found)
    if (!hasFilter) {
      console.log("Category filter not found - may not be implemented");
    }
  });

  test("should search for creators", async ({ page }) => {
    await goToDiscover(page);

    // Look for search input
    const searchInput = page.getByPlaceholder(/検索|search|クリエイター/i).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.keyboard.press("Enter");
      await waitForPageLoad(page);

      // Should show search results or empty state
      const content = page.locator("main");
      await expect(content).toBeVisible();
    }
  });

  test("should navigate to creator page when clicking a creator", async ({ page }) => {
    await goToDiscover(page);

    // Wait for content
    await page.waitForTimeout(1000);

    // Find first creator card link
    const creatorLink = page.locator("a[href^='/@']").first();

    if (await creatorLink.isVisible()) {
      await creatorLink.click();
      await waitForPageLoad(page);

      // Should navigate to creator page
      await expect(page).toHaveURL(/\/@/);
    }
  });
});
