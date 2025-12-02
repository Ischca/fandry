import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser, getUserByOpenId, createCreator, getCreatorByUsername, createTip } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

async function createAuthContext(openId: string): Promise<TrpcContext> {
  const dbUser = await getUserByOpenId(openId);
  if (!dbUser) {
    throw new Error(`User with openId ${openId} not found in database`);
  }
  const user: AuthenticatedUser = dbUser;

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("revenue router", () => {
  const timestamp = Date.now();
  let creatorId: number;

  beforeAll(async () => {
    // Create test creator user
    await upsertUser({
      openId: `revenue-test-creator-${timestamp}`,
      name: "Revenue Test Creator",
      email: "revenuetest@example.com",
      loginMethod: "manus",
    });

    // Create tipper user
    await upsertUser({
      openId: `revenue-test-tipper-${timestamp}`,
      name: "Revenue Test Tipper",
      email: "tipper@example.com",
      loginMethod: "manus",
    });

    // Create the creator profile
    const creatorUser = await getUserByOpenId(`revenue-test-creator-${timestamp}`);
    if (creatorUser) {
      await createCreator({
        userId: creatorUser.id,
        username: `revenue-creator-${timestamp}`,
        displayName: "Revenue Creator",
      });

      const creator = await getCreatorByUsername(`revenue-creator-${timestamp}`);
      if (creator) {
        creatorId = creator.id;

        // Create some tips for testing
        const tipperUser = await getUserByOpenId(`revenue-test-tipper-${timestamp}`);
        if (tipperUser) {
          await createTip({
            userId: tipperUser.id,
            creatorId: creator.id,
            amount: 500,
            message: "Test tip 1",
          });

          await createTip({
            userId: tipperUser.id,
            creatorId: creator.id,
            amount: 1000,
            message: "Test tip 2",
          });

          await createTip({
            userId: tipperUser.id,
            creatorId: creator.id,
            amount: 300,
          });
        }
      }
    }
  });

  it("should return revenue summary for creator", async () => {
    const ctx = await createAuthContext(`revenue-test-creator-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.revenue.getSummary();

    expect(summary).not.toBeNull();
    expect(summary).toHaveProperty("totalSupport");
    expect(summary).toHaveProperty("tipTotal");
    expect(summary).toHaveProperty("tipCount");
    expect(summary).toHaveProperty("activeSubscribers");
    expect(summary).toHaveProperty("mrr");

    // Check that tip totals are calculated correctly
    expect(summary!.tipTotal).toBe(1800); // 500 + 1000 + 300
    expect(summary!.tipCount).toBe(3);
  });

  it("should return null for non-creator user", async () => {
    const ctx = await createAuthContext(`revenue-test-tipper-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.revenue.getSummary();
    expect(summary).toBeNull();
  });

  it("should return recent transactions", async () => {
    const ctx = await createAuthContext(`revenue-test-creator-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.revenue.getRecentTransactions({ limit: 10 });

    expect(Array.isArray(transactions)).toBe(true);
    expect(transactions.length).toBe(3);

    // Check transaction structure
    transactions.forEach((tx) => {
      expect(tx).toHaveProperty("id");
      expect(tx).toHaveProperty("amount");
      expect(tx).toHaveProperty("createdAt");
    });

    // Check that transactions are ordered by date descending
    for (let i = 1; i < transactions.length; i++) {
      expect(new Date(transactions[i - 1].createdAt).getTime())
        .toBeGreaterThanOrEqual(new Date(transactions[i].createdAt).getTime());
    }
  });

  it("should respect limit parameter", async () => {
    const ctx = await createAuthContext(`revenue-test-creator-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.revenue.getRecentTransactions({ limit: 2 });
    expect(transactions.length).toBeLessThanOrEqual(2);
  });

  it("should return empty transactions for non-creator", async () => {
    const ctx = await createAuthContext(`revenue-test-tipper-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const transactions = await caller.revenue.getRecentTransactions({ limit: 10 });
    expect(transactions).toEqual([]);
  });
});

describe("tip.getMyTips", () => {
  const timestamp = Date.now();

  beforeAll(async () => {
    // Create test creator user
    await upsertUser({
      openId: `mytips-test-creator-${timestamp}`,
      name: "MyTips Test Creator",
      email: "mytipstest@example.com",
      loginMethod: "manus",
    });

    // Create tipper user
    await upsertUser({
      openId: `mytips-test-tipper-${timestamp}`,
      name: "MyTips Test Tipper",
      email: "mytipstipper@example.com",
      loginMethod: "manus",
    });

    // Create the creator profile
    const creatorUser = await getUserByOpenId(`mytips-test-creator-${timestamp}`);
    if (creatorUser) {
      await createCreator({
        userId: creatorUser.id,
        username: `mytips-creator-${timestamp}`,
        displayName: "MyTips Creator",
      });

      const creator = await getCreatorByUsername(`mytips-creator-${timestamp}`);
      if (creator) {
        // Create some tips
        const tipperUser = await getUserByOpenId(`mytips-test-tipper-${timestamp}`);
        if (tipperUser) {
          await createTip({
            userId: tipperUser.id,
            creatorId: creator.id,
            amount: 200,
            message: "Nice work!",
          });
        }
      }
    }
  });

  it("should return tips received by creator", async () => {
    const ctx = await createAuthContext(`mytips-test-creator-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const tips = await caller.tip.getMyTips({ limit: 10 });

    expect(Array.isArray(tips)).toBe(true);
    expect(tips.length).toBeGreaterThan(0);

    // Check tip structure
    tips.forEach((tip) => {
      expect(tip).toHaveProperty("id");
      expect(tip).toHaveProperty("amount");
      expect(tip).toHaveProperty("createdAt");
    });
  });

  it("should return empty array for non-creator", async () => {
    const ctx = await createAuthContext(`mytips-test-tipper-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const tips = await caller.tip.getMyTips({ limit: 10 });
    expect(tips).toEqual([]);
  });
});
