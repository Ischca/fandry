import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { upsertUser, createCreator, createPost, followCreator, getUserByOpenId } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number, openId: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId,
    email: `${openId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Feed and Discover", () => {
  // Use unique IDs per test run to avoid state pollution
  const testRunId = Date.now();
  let user1Id: number;
  let user2Id: number;
  let user3Id: number; // Fresh user for empty feed test
  let creator1Id: number;
  let creator2Id: number;

  beforeAll(async () => {
    // Create test users with unique openIds
    await upsertUser({ openId: `test-feed-user-1-${testRunId}`, name: "Feed Test User 1" });
    await upsertUser({ openId: `test-feed-user-2-${testRunId}`, name: "Feed Test User 2" });
    await upsertUser({ openId: `test-feed-user-3-${testRunId}`, name: "Feed Test User 3 (Empty)" });

    const user1 = await getUserByOpenId(`test-feed-user-1-${testRunId}`);
    const user2 = await getUserByOpenId(`test-feed-user-2-${testRunId}`);
    const user3 = await getUserByOpenId(`test-feed-user-3-${testRunId}`);

    if (!user1 || !user2 || !user3) {
      throw new Error("Failed to create test users");
    }

    user1Id = user1.id;
    user2Id = user2.id;
    user3Id = user3.id;

    // Create creators
    const creator1 = await createCreator({
      userId: user1Id,
      username: `feedcreator1_${testRunId}`,
      displayName: "Feed Creator 1",
      bio: "Test creator 1",
    });
    creator1Id = creator1.id;

    const creator2 = await createCreator({
      userId: user2Id,
      username: `feedcreator2_${testRunId}`,
      displayName: "Feed Creator 2",
      bio: "Test creator 2",
    });
    creator2Id = creator2.id;

    // Create posts
    await createPost({
      creatorId: creator1Id,
      title: "Post from Creator 1",
      content: "This is a test post from creator 1",
    });

    await createPost({
      creatorId: creator2Id,
      title: "Post from Creator 2",
      content: "This is a test post from creator 2",
    });
  });

  it("should return empty feed when user follows no one", async () => {
    // Use user3 who doesn't follow anyone
    const ctx = createAuthContext(user3Id, `test-feed-user-3-${testRunId}`);
    const caller = appRouter.createCaller(ctx);

    const feed = await caller.feed.getFollowingPosts();

    expect(feed).toEqual([]);
  });

  it("should return posts from followed creators", async () => {
    // User 1 follows Creator 2
    await followCreator(user1Id, creator2Id);

    const ctx = createAuthContext(user1Id, `test-feed-user-1-${testRunId}`);
    const caller = appRouter.createCaller(ctx);

    const feed = await caller.feed.getFollowingPosts();

    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0]?.creator.id).toBe(creator2Id);
  });

  it("should return all creators in discover", async () => {
    const ctx = createAuthContext(user1Id, `test-feed-user-1-${testRunId}`);
    const caller = appRouter.createCaller(ctx);

    const creators = await caller.discover.getAllCreators({ limit: 50 });

    expect(creators.length).toBeGreaterThanOrEqual(2);
  });

  it("should search creators by username", async () => {
    const ctx = createAuthContext(user1Id, `test-feed-user-1-${testRunId}`);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.discover.searchCreators({ query: `feedcreator1_${testRunId}` });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.displayName).toContain("Feed Creator 1");
  });
});
