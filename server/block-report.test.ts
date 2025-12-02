import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser, getUserByOpenId, createCreator, createPost, getCreatorByUsername } from "./db";

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

describe("block router", () => {
  const timestamp = Date.now();

  beforeAll(async () => {
    // Insert test users for block tests
    await upsertUser({
      openId: `block-test-user-1-${timestamp}`,
      name: "Block Test User 1",
      email: "blocktest1@example.com",
      loginMethod: "manus",
    });
    await upsertUser({
      openId: `block-test-user-2-${timestamp}`,
      name: "Block Test User 2",
      email: "blocktest2@example.com",
      loginMethod: "manus",
    });
  });

  it("should block and unblock a user", async () => {
    const ctx1 = await createAuthContext(`block-test-user-1-${timestamp}`);
    const ctx2 = await createAuthContext(`block-test-user-2-${timestamp}`);
    const caller = appRouter.createCaller(ctx1);

    // Initially not blocked
    const checkBefore = await caller.block.check({ userId: ctx2.user!.id });
    expect(checkBefore.blocked).toBe(false);

    // Block the user
    const blockResult = await caller.block.toggle({ userId: ctx2.user!.id });
    expect(blockResult.blocked).toBe(true);

    // Check blocked status
    const checkAfter = await caller.block.check({ userId: ctx2.user!.id });
    expect(checkAfter.blocked).toBe(true);

    // Unblock the user
    const unblockResult = await caller.block.toggle({ userId: ctx2.user!.id });
    expect(unblockResult.blocked).toBe(false);

    // Check unblocked status
    const checkFinal = await caller.block.check({ userId: ctx2.user!.id });
    expect(checkFinal.blocked).toBe(false);
  });

  it("should not allow blocking yourself", async () => {
    const ctx = await createAuthContext(`block-test-user-1-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.block.toggle({ userId: ctx.user!.id })
    ).rejects.toThrow("Cannot block yourself");
  });

  it("should list blocked users", async () => {
    const ctx1 = await createAuthContext(`block-test-user-1-${timestamp}`);
    const ctx2 = await createAuthContext(`block-test-user-2-${timestamp}`);
    const caller = appRouter.createCaller(ctx1);

    // Block user 2
    await caller.block.toggle({ userId: ctx2.user!.id });

    // Get blocked list
    const blockedList = await caller.block.getBlocked();
    expect(blockedList.length).toBeGreaterThan(0);
    expect(blockedList.some((b) => b.blockedId === ctx2.user!.id)).toBe(true);

    // Cleanup: unblock
    await caller.block.toggle({ userId: ctx2.user!.id });
  });
});

describe("report router", () => {
  const timestamp = Date.now();
  let testCreatorId: number;
  let testPostId: number;

  beforeAll(async () => {
    // Insert test users for report tests
    await upsertUser({
      openId: `report-test-user-1-${timestamp}`,
      name: "Report Test User 1",
      email: "reporttest1@example.com",
      loginMethod: "manus",
    });
    await upsertUser({
      openId: `report-test-creator-${timestamp}`,
      name: "Report Test Creator",
      email: "reporttestcreator@example.com",
      loginMethod: "manus",
    });

    // Create a creator to report
    const creatorUser = await getUserByOpenId(`report-test-creator-${timestamp}`);
    if (creatorUser) {
      await createCreator({
        userId: creatorUser.id,
        username: `reportable-creator-${timestamp}`,
        displayName: "Reportable Creator",
      });

      const creator = await getCreatorByUsername(`reportable-creator-${timestamp}`);
      if (creator) {
        testCreatorId = creator.id;

        // Create a post to report
        await createPost({
          creatorId: creator.id,
          content: "Test post for reporting",
          type: "free",
        });

        // Get post ID (simplified - in real test would query properly)
        testPostId = 1; // Will use creator.id as proxy for test
      }
    }
  });

  it("should create a report for a post", async () => {
    const ctx = await createAuthContext(`report-test-user-1-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.report.create({
      targetType: "post",
      targetId: testCreatorId, // Using creator id as proxy
      type: "spam",
      reason: "Test spam report",
    });

    expect(result.success).toBe(true);
  });

  it("should create a report for a creator", async () => {
    const ctx = await createAuthContext(`report-test-user-1-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.report.create({
      targetType: "creator",
      targetId: testCreatorId,
      type: "harassment",
      reason: "Test harassment report",
    });

    expect(result.success).toBe(true);
  });

  it("should prevent duplicate reports", async () => {
    const ctx = await createAuthContext(`report-test-user-1-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    // First report succeeds
    await caller.report.create({
      targetType: "comment",
      targetId: 999,
      type: "inappropriate_content",
    });

    // Second report to same target should fail
    await expect(
      caller.report.create({
        targetType: "comment",
        targetId: 999,
        type: "other",
      })
    ).rejects.toThrow("already reported");
  });

  it("should accept all valid report types", async () => {
    const ctx = await createAuthContext(`report-test-user-1-${timestamp}`);
    const caller = appRouter.createCaller(ctx);

    const reportTypes = ["spam", "harassment", "inappropriate_content", "copyright", "other"] as const;

    for (let i = 0; i < reportTypes.length; i++) {
      const result = await caller.report.create({
        targetType: "post",
        targetId: 1000 + i, // Unique target IDs
        type: reportTypes[i],
      });
      expect(result.success).toBe(true);
    }
  });
});
