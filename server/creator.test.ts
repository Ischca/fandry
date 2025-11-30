import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser, getUserByOpenId } from "./db";

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

describe("creator router", () => {
  beforeAll(async () => {
    // Insert test users into database
    await upsertUser({
      openId: "test-user-1",
      name: "Test User 1",
      email: "user1@example.com",
      loginMethod: "manus",
    });
    await upsertUser({
      openId: "test-user-2",
      name: "Test User 2",
      email: "user2@example.com",
      loginMethod: "manus",
    });
    await upsertUser({
      openId: "test-user-3",
      name: "Test User 3",
      email: "user3@example.com",
      loginMethod: "manus",
    });
    await upsertUser({
      openId: "test-user-4",
      name: "Test User 4",
      email: "user4@example.com",
      loginMethod: "manus",
    });
  });

  it("should create a creator profile", async () => {
    const ctx = await createAuthContext("test-user-1");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.creator.create({
      username: `testcreator-${Date.now()}`,
      displayName: "Test Creator",
      bio: "This is a test creator",
      category: "Art",
    });

    expect(result.success).toBe(true);
  });

  it("should prevent duplicate usernames", async () => {
    const ctx = await createAuthContext("test-user-2");
    const caller = appRouter.createCaller(ctx);

    const uniqueUsername = `uniquecreator-${Date.now()}`;

    // First creation should succeed
    await caller.creator.create({
      username: uniqueUsername,
      displayName: "Unique Creator",
    });

    // Second creation with same username should fail
    await expect(
      caller.creator.create({
        username: uniqueUsername,
        displayName: "Another Creator",
      })
    ).rejects.toThrow();
  });
});

describe("tip router", () => {
  it("should create a tip", async () => {
    const ctx = await createAuthContext("test-user-3");
    const caller = appRouter.createCaller(ctx);

    const username = `tippablecreator-${Date.now()}`;

    // First create a creator to tip
    await caller.creator.create({
      username,
      displayName: "Tippable Creator",
    });

    const creator = await caller.creator.getByUsername({ username });

    const result = await caller.tip.create({
      creatorId: creator.id,
      amount: 500,
      message: "Great work!",
    });

    expect(result.success).toBe(true);
  });

  it("should reject tips below minimum amount", async () => {
    const ctx = await createAuthContext("test-user-4");
    const caller = appRouter.createCaller(ctx);

    const username = `anothercreator-${Date.now()}`;

    await caller.creator.create({
      username,
      displayName: "Another Creator",
    });

    const creator = await caller.creator.getByUsername({ username });

    await expect(
      caller.tip.create({
        creatorId: creator.id,
        amount: 50, // Below minimum of 100
      })
    ).rejects.toThrow();
  });
});
