import { describe, expect, it, beforeAll, vi } from "vitest";
import { createTestUser, createMockAuthContext, createMockUser, expectTRPCError } from "../test/helpers";
import { appRouter } from "../routers";

describe("pointRouter", () => {
  describe("getBalance", () => {
    it("should return zero balance for new user", async () => {
      const { caller } = await createTestUser("point-balance");

      const result = await caller.point.getBalance();

      expect(result.balance).toBe(0);
      expect(result.totalPurchased).toBe(0);
      expect(result.totalSpent).toBe(0);
    });

    it("should return updated balance after crediting points", async () => {
      const { caller } = await createTestUser("point-credit");

      // Credit some points
      await caller.point.creditPoints({ amount: 1000 });

      const result = await caller.point.getBalance();

      expect(result.balance).toBe(1000);
      expect(result.totalPurchased).toBe(1000);
    });
  });

  describe("getTransactions", () => {
    it("should return empty array for new user", async () => {
      const { caller } = await createTestUser("point-tx-empty");

      const result = await caller.point.getTransactions({});

      expect(result).toEqual([]);
    });

    it("should return transactions after crediting points", async () => {
      const { caller } = await createTestUser("point-tx-list");

      await caller.point.creditPoints({ amount: 500 });

      const result = await caller.point.getTransactions({});

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toMatchObject({
        type: "purchase",
        amount: 500,
      });
    });

    it("should respect limit parameter", async () => {
      const { caller } = await createTestUser("point-tx-limit");

      // Credit multiple times
      await caller.point.creditPoints({ amount: 100 });
      await caller.point.creditPoints({ amount: 200 });
      await caller.point.creditPoints({ amount: 300 });

      const result = await caller.point.getTransactions({ limit: 2 });

      expect(result.length).toBe(2);
    });
  });

  describe("getPackages", () => {
    it("should return available packages", async () => {
      const { caller } = await createTestUser("point-packages");

      const result = await caller.point.getPackages();

      // Result should be an array (may be empty if no packages configured)
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("creditPoints", () => {
    it("should credit points to user", async () => {
      const { caller } = await createTestUser("point-credit-test");

      const result = await caller.point.creditPoints({
        amount: 1500,
        description: "Test credit",
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1500);
    });

    it("should accumulate points on multiple credits", async () => {
      const { caller } = await createTestUser("point-credit-multi");

      await caller.point.creditPoints({ amount: 500 });
      const result = await caller.point.creditPoints({ amount: 700 });

      expect(result.newBalance).toBe(1200);
    });
  });

  describe("deductPoints", () => {
    it("should deduct points from user balance", async () => {
      const { caller } = await createTestUser("point-deduct");

      // First credit some points
      await caller.point.creditPoints({ amount: 1000 });

      // Then deduct
      const result = await caller.point.deductPoints({
        amount: 300,
        type: "tip",
        description: "Test tip",
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(700);
    });

    it("should throw error when insufficient balance", async () => {
      const { caller } = await createTestUser("point-deduct-fail");

      // Credit only 100 points
      await caller.point.creditPoints({ amount: 100 });

      // Try to deduct 500
      await expect(
        caller.point.deductPoints({
          amount: 500,
          type: "post_purchase",
        })
      ).rejects.toThrow("Insufficient point balance");
    });

    it("should throw error when no balance exists", async () => {
      const { caller } = await createTestUser("point-deduct-none");

      await expect(
        caller.point.deductPoints({
          amount: 100,
          type: "subscription",
        })
      ).rejects.toThrow("Insufficient point balance");
    });
  });
});
