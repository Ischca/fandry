import { describe, expect, it } from "vitest";
import { createTestUser, createTestCreator } from "../test/helpers";

describe("tipRouter", () => {
  describe("getTipOptions", () => {
    it("should return tip options for a creator", async () => {
      const { creator } = await createTestCreator("tip-options");
      const { caller } = await createTestUser("tip-options-user");

      const result = await caller.tip.getTipOptions({ creatorId: creator.id });

      expect(result.creator.id).toBe(creator.id);
      expect(result.paymentMethods).toContain("points");
      expect(result.presetAmounts).toEqual([100, 500, 1000, 3000, 5000, 10000]);
      expect(result.userBalance).toBe(0);
    });

    it("should reflect user balance in options", async () => {
      const { creator } = await createTestCreator("tip-options-balance");
      const { caller } = await createTestUser("tip-options-balance-user");

      // Credit points
      await caller.point.creditPoints({ amount: 5000 });

      const result = await caller.tip.getTipOptions({ creatorId: creator.id });

      expect(result.userBalance).toBe(5000);
    });

    it("should throw error for non-existent creator", async () => {
      const { caller } = await createTestUser("tip-options-nocreator");

      await expect(
        caller.tip.getTipOptions({ creatorId: 999999 })
      ).rejects.toThrow("Creator not found");
    });
  });

  describe("sendWithPoints", () => {
    it("should send tip with points", async () => {
      const { creator } = await createTestCreator("tip-points");
      const { caller } = await createTestUser("tip-points-user");

      // Credit points
      await caller.point.creditPoints({ amount: 1000 });

      const result = await caller.tip.sendWithPoints({
        creatorId: creator.id,
        amount: 500,
        message: "Great work!",
      });

      expect(result.success).toBe(true);
      expect(result.tipId).toBeDefined();
      expect(result.newBalance).toBe(500);
    });

    it("should throw error for insufficient balance", async () => {
      const { creator } = await createTestCreator("tip-points-low");
      const { caller } = await createTestUser("tip-points-low-user");

      await caller.point.creditPoints({ amount: 100 });

      await expect(
        caller.tip.sendWithPoints({
          creatorId: creator.id,
          amount: 500,
        })
      ).rejects.toThrow("ポイント残高が不足しています");
    });

    it("should throw error for amount below minimum", async () => {
      const { creator } = await createTestCreator("tip-points-min");
      const { caller } = await createTestUser("tip-points-min-user");

      await caller.point.creditPoints({ amount: 1000 });

      await expect(
        caller.tip.sendWithPoints({
          creatorId: creator.id,
          amount: 50, // Below 100 minimum
        })
      ).rejects.toThrow();
    });

    it("should throw error for non-existent creator", async () => {
      const { caller } = await createTestUser("tip-points-nocreator");

      await caller.point.creditPoints({ amount: 1000 });

      await expect(
        caller.tip.sendWithPoints({
          creatorId: 999999,
          amount: 500,
        })
      ).rejects.toThrow("Creator not found");
    });

    it("should include message in tip", async () => {
      const { creator } = await createTestCreator("tip-points-msg");
      const { caller } = await createTestUser("tip-points-msg-user");

      await caller.point.creditPoints({ amount: 1000 });

      const result = await caller.tip.sendWithPoints({
        creatorId: creator.id,
        amount: 300,
        message: "Keep up the awesome work!",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("createHybridCheckout", () => {
    it("should complete tip when points cover full amount", async () => {
      const { creator } = await createTestCreator("tip-hybrid-full");
      const { caller } = await createTestUser("tip-hybrid-full-user");

      await caller.point.creditPoints({ amount: 500 });

      const result = await caller.tip.createHybridCheckout({
        creatorId: creator.id,
        amount: 500,
        pointsToUse: 500,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result.success).toBe(true);
      expect(result.requiresStripe).toBe(false);
      expect(result.newBalance).toBe(0);
    });

    it("should throw error for points exceeding amount", async () => {
      const { creator } = await createTestCreator("tip-hybrid-excess");
      const { caller } = await createTestUser("tip-hybrid-excess-user");

      await caller.point.creditPoints({ amount: 1000 });

      await expect(
        caller.tip.createHybridCheckout({
          creatorId: creator.id,
          amount: 300,
          pointsToUse: 500,
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        })
      ).rejects.toThrow("使用ポイントが金額を超えています");
    });

    it("should throw error for insufficient balance", async () => {
      const { creator } = await createTestCreator("tip-hybrid-low");
      const { caller } = await createTestUser("tip-hybrid-low-user");

      await caller.point.creditPoints({ amount: 100 });

      await expect(
        caller.tip.createHybridCheckout({
          creatorId: creator.id,
          amount: 500,
          pointsToUse: 200, // More than balance
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        })
      ).rejects.toThrow("ポイント残高が不足しています");
    });
  });

  describe("getByCreatorId", () => {
    it("should return tips for a creator", async () => {
      const { creator, caller: creatorCaller } = await createTestCreator("tip-list");
      const { caller: userCaller } = await createTestUser("tip-list-user");

      // Send some tips
      await userCaller.point.creditPoints({ amount: 1000 });
      await userCaller.tip.sendWithPoints({
        creatorId: creator.id,
        amount: 200,
        message: "Tip 1",
      });
      await userCaller.tip.sendWithPoints({
        creatorId: creator.id,
        amount: 300,
        message: "Tip 2",
      });

      const result = await creatorCaller.tip.getByCreatorId({ creatorId: creator.id });

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should return empty array for creator with no tips", async () => {
      const { creator, caller } = await createTestCreator("tip-list-empty");

      const result = await caller.tip.getByCreatorId({ creatorId: creator.id });

      expect(result).toEqual([]);
    });
  });

  describe("getMyTips", () => {
    it("should return tips received by creator", async () => {
      const { creator, caller: creatorCaller } = await createTestCreator("tip-mytips");
      const { caller: userCaller } = await createTestUser("tip-mytips-user");

      // Send a tip
      await userCaller.point.creditPoints({ amount: 500 });
      await userCaller.tip.sendWithPoints({
        creatorId: creator.id,
        amount: 500,
        message: "Support!",
      });

      const result = await creatorCaller.tip.getMyTips({});

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toMatchObject({
        amount: 500,
        message: "Support!",
      });
    });

    it("should return empty array for non-creator user", async () => {
      const { caller } = await createTestUser("tip-mytips-nouser");

      const result = await caller.tip.getMyTips({});

      expect(result).toEqual([]);
    });
  });
});
