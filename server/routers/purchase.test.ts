import { describe, expect, it, beforeAll } from "vitest";
import { createTestUser, createTestCreator, createTestPost, uniqueId } from "../test/helpers";
import { createPost } from "../db";

describe("purchaseRouter", () => {
  describe("checkPurchase", () => {
    it("should return false for unpurchased post", async () => {
      const { creator } = await createTestCreator("purchase-check");
      const { caller } = await createTestUser("purchase-check-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 500 });

      const result = await caller.purchase.checkPurchase({ postId: post.id });

      expect(result.purchased).toBe(false);
    });

    it("should return true after purchasing a post", async () => {
      const { creator } = await createTestCreator("purchase-check-bought");
      const { caller } = await createTestUser("purchase-check-bought-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 300 });

      // Credit points and purchase
      await caller.point.creditPoints({ amount: 500 });
      await caller.purchase.purchaseWithPoints({ postId: post.id });

      const result = await caller.purchase.checkPurchase({ postId: post.id });

      expect(result.purchased).toBe(true);
    });
  });

  describe("getPurchaseOptions", () => {
    it("should return purchase options for paid post", async () => {
      const { creator } = await createTestCreator("purchase-options");
      const { caller } = await createTestUser("purchase-options-user");

      const post = await createTestPost(creator.id, {
        type: "paid",
        price: 1000,
        title: "Paid Content",
      });

      // Credit some points
      await caller.point.creditPoints({ amount: 500 });

      const result = await caller.purchase.getPurchaseOptions({ postId: post.id });

      expect(result.alreadyPurchased).toBe(false);
      expect(result.post?.price).toBe(1000);
      expect(result.userBalance).toBe(500);
      expect(result.paymentMethods).toContain("points");
    });

    it("should indicate already purchased", async () => {
      const { creator } = await createTestCreator("purchase-options-bought");
      const { caller } = await createTestUser("purchase-options-bought-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 200 });

      // Purchase the post
      await caller.point.creditPoints({ amount: 500 });
      await caller.purchase.purchaseWithPoints({ postId: post.id });

      const result = await caller.purchase.getPurchaseOptions({ postId: post.id });

      expect(result.alreadyPurchased).toBe(true);
    });

    it("should throw error for free post", async () => {
      const { creator } = await createTestCreator("purchase-options-free");
      const { caller } = await createTestUser("purchase-options-free-user");

      const post = await createTestPost(creator.id, { type: "free", price: 0 });

      await expect(
        caller.purchase.getPurchaseOptions({ postId: post.id })
      ).rejects.toThrow("This post is free");
    });

    it("should only allow points for adult content", async () => {
      const { creator } = await createTestCreator("purchase-options-adult");
      const { caller } = await createTestUser("purchase-options-adult-user");

      const post = await createTestPost(creator.id, {
        type: "paid",
        price: 500,
        isAdult: 1,
      });

      const result = await caller.purchase.getPurchaseOptions({ postId: post.id });

      expect(result.isAdult).toBe(true);
      expect(result.paymentMethods).toEqual(["points"]);
    });
  });

  describe("purchaseWithPoints", () => {
    it("should successfully purchase a post with points", async () => {
      const { creator } = await createTestCreator("purchase-points");
      const { caller } = await createTestUser("purchase-points-user");

      const post = await createTestPost(creator.id, {
        type: "paid",
        price: 300,
        title: "Points Purchase Test",
      });

      // Credit points
      await caller.point.creditPoints({ amount: 500 });

      const result = await caller.purchase.purchaseWithPoints({ postId: post.id });

      expect(result.success).toBe(true);
      expect(result.purchaseId).toBeDefined();
      expect(result.newBalance).toBe(200); // 500 - 300
    });

    it("should throw error for free post", async () => {
      const { creator } = await createTestCreator("purchase-points-free");
      const { caller } = await createTestUser("purchase-points-free-user");

      const post = await createTestPost(creator.id, { type: "free", price: 0 });

      await expect(
        caller.purchase.purchaseWithPoints({ postId: post.id })
      ).rejects.toThrow("This post is free");
    });

    it("should throw error for insufficient balance", async () => {
      const { creator } = await createTestCreator("purchase-points-low");
      const { caller } = await createTestUser("purchase-points-low-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 1000 });

      // Only credit 100 points
      await caller.point.creditPoints({ amount: 100 });

      await expect(
        caller.purchase.purchaseWithPoints({ postId: post.id })
      ).rejects.toThrow();
    });

    it("should throw error for already purchased post", async () => {
      const { creator } = await createTestCreator("purchase-points-dup");
      const { caller } = await createTestUser("purchase-points-dup-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 100 });

      await caller.point.creditPoints({ amount: 500 });
      await caller.purchase.purchaseWithPoints({ postId: post.id });

      // Try to purchase again
      await expect(
        caller.purchase.purchaseWithPoints({ postId: post.id })
      ).rejects.toThrow("Already purchased");
    });

    it("should throw error for non-existent post", async () => {
      const { caller } = await createTestUser("purchase-points-nopost");

      await expect(
        caller.purchase.purchaseWithPoints({ postId: 999999 })
      ).rejects.toThrow("Post not found");
    });
  });

  describe("createHybridCheckout", () => {
    it("should complete purchase when points cover full price", async () => {
      const { creator } = await createTestCreator("purchase-hybrid-full");
      const { caller } = await createTestUser("purchase-hybrid-full-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 500 });

      // Credit exact amount
      await caller.point.creditPoints({ amount: 500 });

      const result = await caller.purchase.createHybridCheckout({
        postId: post.id,
        pointsToUse: 500,
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

      expect(result.success).toBe(true);
      expect(result.requiresStripe).toBe(false);
      expect(result.newBalance).toBe(0);
    });

    it("should throw error for adult content", async () => {
      const { creator } = await createTestCreator("purchase-hybrid-adult");
      const { caller } = await createTestUser("purchase-hybrid-adult-user");

      const post = await createTestPost(creator.id, {
        type: "paid",
        price: 500,
        isAdult: 1,
      });

      await caller.point.creditPoints({ amount: 200 });

      await expect(
        caller.purchase.createHybridCheckout({
          postId: post.id,
          pointsToUse: 200,
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        })
      ).rejects.toThrow("アダルトコンテンツはポイントでのみ購入可能です");
    });

    it("should throw error for points exceeding price", async () => {
      const { creator } = await createTestCreator("purchase-hybrid-excess");
      const { caller } = await createTestUser("purchase-hybrid-excess-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 300 });

      await caller.point.creditPoints({ amount: 1000 });

      await expect(
        caller.purchase.createHybridCheckout({
          postId: post.id,
          pointsToUse: 500, // More than price
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        })
      ).rejects.toThrow("使用ポイントが価格を超えています");
    });

    it("should throw error for insufficient balance", async () => {
      const { creator } = await createTestCreator("purchase-hybrid-low");
      const { caller } = await createTestUser("purchase-hybrid-low-user");

      const post = await createTestPost(creator.id, { type: "paid", price: 500 });

      await caller.point.creditPoints({ amount: 100 });

      await expect(
        caller.purchase.createHybridCheckout({
          postId: post.id,
          pointsToUse: 200, // More than balance
          successUrl: "https://example.com/success",
          cancelUrl: "https://example.com/cancel",
        })
      ).rejects.toThrow("ポイント残高が不足しています");
    });
  });
});
