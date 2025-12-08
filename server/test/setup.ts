/**
 * Test Setup - Vitest global setup
 */
import { beforeAll, afterAll, vi } from "vitest";

// Mock environment variables for tests
beforeAll(() => {
  // Ensure DATABASE_URL is set for tests
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set - some tests may fail");
  }

  // Mock Stripe for payment tests
  vi.mock("stripe", () => ({
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "mock_session_id",
            url: "https://checkout.stripe.com/mock",
          }),
        },
      },
      subscriptions: {
        cancel: vi.fn().mockResolvedValue({ id: "mock_sub_id" }),
      },
    })),
  }));
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Extend expect with custom matchers
declare module "vitest" {
  interface Assertion<T> {
    toBeValidDate(): T;
  }
}
