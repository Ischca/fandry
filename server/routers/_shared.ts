// Shared imports and utilities for routers
export { publicProcedure, protectedProcedure, router } from "../_core/trpc";
export { TRPCError } from "@trpc/server";
export { z } from "zod";
export { eq, sql } from "drizzle-orm";
export { getDb } from "../db";
export {
  creators,
  posts,
  media,
  subscriptionPlans,
  subscriptions,
  tips,
  reports,
  blocks,
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
