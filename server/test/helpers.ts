/**
 * Test Helpers - 統一されたテストユーティリティ
 */
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { upsertUser, getUserByOpenId, createCreator, createPost } from "../db";
import type { User } from "../../drizzle/schema";

// Types
export type AuthenticatedUser = NonNullable<TrpcContext["user"]>;
export type TestContext = TrpcContext & {
  clearedCookies: Array<{ name: string; options: Record<string, unknown> }>;
};

/**
 * Create a mock context for unauthenticated requests
 */
export function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

/**
 * Create a mock context for authenticated requests
 */
export function createMockAuthContext(user: AuthenticatedUser): TestContext {
  const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as unknown as TrpcContext["res"],
    clearedCookies,
  };
}

/**
 * Create a mock user object (without DB)
 */
export function createMockUser(overrides: Partial<User> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: `test-user-${Date.now()}`,
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock admin user object
 */
export function createMockAdminUser(overrides: Partial<User> = {}): AuthenticatedUser {
  return createMockUser({
    role: "admin",
    ...overrides,
  });
}

/**
 * Create a real user in the database and return context
 */
export async function createTestUser(
  openIdSuffix?: string
): Promise<{ user: User; ctx: TestContext; caller: ReturnType<typeof appRouter.createCaller> }> {
  const openId = `test-user-${openIdSuffix || Date.now()}-${Math.random().toString(36).slice(2)}`;

  await upsertUser({
    openId,
    name: `Test User ${openId}`,
    email: `${openId}@test.example.com`,
    loginMethod: "test",
  });

  const user = await getUserByOpenId(openId);
  if (!user) {
    throw new Error(`Failed to create test user with openId: ${openId}`);
  }

  const ctx = createMockAuthContext(user);
  const caller = appRouter.createCaller(ctx);

  return { user, ctx, caller };
}

/**
 * Create a test user who is also a creator
 */
export async function createTestCreator(usernamePrefix?: string) {
  const { user, ctx, caller } = await createTestUser();

  const username = `${usernamePrefix || "testcreator"}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const creator = await createCreator({
    userId: user.id,
    username,
    displayName: `Creator ${username}`,
    bio: "Test creator bio",
  });

  return { user, creator, ctx, caller };
}

/**
 * Create a test post
 */
export async function createTestPost(
  creatorId: number,
  overrides: Partial<Parameters<typeof createPost>[0]> = {}
) {
  return createPost({
    creatorId,
    title: `Test Post ${Date.now()}`,
    content: "Test post content",
    type: "free",
    ...overrides,
  });
}

/**
 * Generate unique identifier for tests
 */
export function uniqueId(prefix = "test"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("waitFor timeout");
}

/**
 * Create a tRPC caller with the given context
 */
export function createCaller(ctx: TrpcContext) {
  return appRouter.createCaller(ctx);
}

/**
 * Assert that an async function throws a TRPCError with specific code
 */
export async function expectTRPCError(
  fn: () => Promise<unknown>,
  expectedCode: string
): Promise<void> {
  try {
    await fn();
    throw new Error(`Expected TRPCError with code ${expectedCode} but no error was thrown`);
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error) {
      const trpcError = error as { code: string };
      if (trpcError.code !== expectedCode) {
        throw new Error(`Expected TRPCError code ${expectedCode} but got ${trpcError.code}`);
      }
    } else {
      throw error;
    }
  }
}
