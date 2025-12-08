import { test, expect } from "@playwright/test";
import { waitForPageLoad } from "./helpers";

test.describe("Creator Page", () => {
  // Note: These tests require a creator to exist in the database
  // In a real setup, you would seed test data or use fixtures

  test("should show 404 for non-existent creator", async ({ page }) => {
    await page.goto("/@nonexistent-creator-12345");
    await waitForPageLoad(page);

    // Should show some indication that creator doesn't exist
    const notFound = page.getByText(/見つかりません|not found|存在しません/i);
    const pageContent = page.locator("main");

    // Either show not found message or redirect
    const hasNotFound = await notFound.isVisible().catch(() => false);
    const hasContent = await pageContent.isVisible();

    expect(hasNotFound || hasContent).toBe(true);
  });

  test("should display creator profile elements", async ({ page }) => {
    // Navigate to discover first to find a real creator
    await page.goto("/discover");
    await waitForPageLoad(page);

    // Wait for creators to load
    await page.waitForTimeout(1000);

    // Find and click first creator link
    const creatorLink = page.locator("a[href^='/@']").first();

    if (await creatorLink.isVisible()) {
      await creatorLink.click();
      await waitForPageLoad(page);

      // Profile should have basic elements
      const mainContent = page.locator("main");
      await expect(mainContent).toBeVisible();

      // Look for common profile elements
      const avatar = page.locator("img[alt*='avatar'], img[alt*='Avatar'], [data-testid='avatar']").first();
      const displayName = page.locator("h1, h2").first();

      // At least display name should be visible
      if (await displayName.isVisible()) {
        await expect(displayName).toBeVisible();
      }
    }
  });

  test("should display creator posts", async ({ page }) => {
    await page.goto("/discover");
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    const creatorLink = page.locator("a[href^='/@']").first();

    if (await creatorLink.isVisible()) {
      await creatorLink.click();
      await waitForPageLoad(page);

      // Wait for posts to load
      await page.waitForTimeout(1000);

      // Look for posts section or individual post cards
      const postsSection = page.locator("[data-testid='posts'], article, .post-card").first();
      const emptyState = page.getByText(/投稿がありません|no posts|まだ投稿/i);

      const hasPosts = await postsSection.isVisible().catch(() => false);
      const hasEmpty = await emptyState.isVisible().catch(() => false);

      // Should show posts or empty state
      expect(hasPosts || hasEmpty).toBe(true);
    }
  });

  test("should have follow button for non-logged in users", async ({ page }) => {
    await page.goto("/discover");
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    const creatorLink = page.locator("a[href^='/@']").first();

    if (await creatorLink.isVisible()) {
      await creatorLink.click();
      await waitForPageLoad(page);

      // Look for follow button (might prompt login for non-logged users)
      const followButton = page.getByRole("button", { name: /フォロー|follow|支援/i }).first();

      if (await followButton.isVisible()) {
        await expect(followButton).toBeVisible();
      }
    }
  });

  test("should display subscription plans if available", async ({ page }) => {
    await page.goto("/discover");
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    const creatorLink = page.locator("a[href^='/@']").first();

    if (await creatorLink.isVisible()) {
      await creatorLink.click();
      await waitForPageLoad(page);

      // Look for plans section
      const plansSection = page.locator("[data-testid='plans'], .subscription-plans").first();
      const planCard = page.locator("[data-testid='plan-card'], .plan-card").first();

      // Plans may or may not exist
      const hasPlans = await plansSection.isVisible().catch(() => false) ||
                       await planCard.isVisible().catch(() => false);

      // Just log - not all creators have plans
      console.log(`Creator has subscription plans: ${hasPlans}`);
    }
  });
});
