import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number, username: string): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-openid-${userId}`,
    name: `Test User ${userId}`,
    username,
    role: "user",
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

describe("post.create", () => {
  it("should reject post creation from non-creator", async () => {
    // 存在しないユーザーIDでテスト（クリエイターではない）
    const ctx = createTestContext(99999, "non_creator_user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.post.create({
        title: "Test Post",
        content: "This should fail",
        type: "free",
      })
    ).rejects.toThrow("You must be a creator to post");
  });

  it("should validate post type enum", async () => {
    const ctx = createTestContext(1, "test_user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.post.create({
        title: "Test Post",
        content: "Test content",
        // @ts-expect-error - Testing invalid type
        type: "invalid_type",
      })
    ).rejects.toThrow();
  });

  it("should require content field", async () => {
    const ctx = createTestContext(1, "test_user");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.post.create({
        title: "Test Post",
        // @ts-expect-error - Testing missing content
        type: "free",
      })
    ).rejects.toThrow();
  });
});
