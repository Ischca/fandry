import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { clerkClient, getAuth } from "@clerk/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const auth = getAuth(opts.req);

    if (auth.userId) {
      // Check if user exists in our database
      const existingUser = await db.getUserByOpenId(auth.userId);

      // If not, create the user
      if (!existingUser) {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        await db.upsertUser({
          openId: auth.userId,
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : clerkUser.username || null,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          loginMethod: "clerk",
          lastSignedIn: new Date(),
        });
        user = (await db.getUserByOpenId(auth.userId)) ?? null;
      } else {
        // Update last signed in
        await db.upsertUser({
          openId: auth.userId,
          lastSignedIn: new Date(),
        });
        user = existingUser;
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    console.error("[Auth] Error:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
