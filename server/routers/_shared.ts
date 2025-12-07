// Shared imports and utilities for routers
export { publicProcedure, protectedProcedure, router } from "../_core/trpc";
export { TRPCError } from "@trpc/server";
export { z } from "zod";
export { eq, sql, and, gte } from "drizzle-orm";
export { getDb } from "../db";
export {
  creators,
  posts,
  media,
  subscriptionPlans,
  subscriptions,
  tips,
  purchases,
  reports,
  blocks,
  userPoints,
  pointTransactions,
  pointPackages,
  creatorBalances,
  withdrawals,
  bankAccounts,
  notifications,
} from "../../drizzle/schema";

// Unified error handling
export {
  ErrorMessages,
  assertDb,
  assertFound,
  assertCreator,
  assertOwnership,
  throwConflict,
  throwBadRequest,
} from "./_errors";
