import { Page, expect } from "@playwright/test";

/**
 * E2E Test Helpers
 */

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

/**
 * Navigate to home page and wait for load
 */
export async function goToHome(page: Page) {
  await page.goto("/");
  await waitForPageLoad(page);
}

/**
 * Navigate to creator page
 */
export async function goToCreatorPage(page: Page, username: string) {
  await page.goto(`/${username}`);
  await waitForPageLoad(page);
}

/**
 * Navigate to discover page
 */
export async function goToDiscover(page: Page) {
  await page.goto("/discover");
  await waitForPageLoad(page);
}

/**
 * Navigate to feed page
 */
export async function goToFeed(page: Page) {
  await page.goto("/feed");
  await waitForPageLoad(page);
}

/**
 * Check if user is logged in by looking for avatar in header
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const avatar = page.locator("[data-testid='user-avatar']");
  return await avatar.isVisible().catch(() => false);
}

/**
 * Check for toast notification
 */
export async function expectToast(page: Page, text: string) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
  await expect(toast).toBeVisible({ timeout: 5000 });
}

/**
 * Wait for and click a button by text
 */
export async function clickButton(page: Page, text: string) {
  await page.getByRole("button", { name: text }).click();
}

/**
 * Fill an input field by label
 */
export async function fillInput(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

/**
 * Check that an element with specific text is visible
 */
export async function expectTextVisible(page: Page, text: string) {
  await expect(page.getByText(text)).toBeVisible();
}

/**
 * Take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png` });
}
