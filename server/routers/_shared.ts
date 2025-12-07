// Shared imports and utilities for routers
export { publicProcedure, protectedProcedure, router } from "../_core/trpc";
export { TRPCError } from "@trpc/server";
export { z } from "zod";
export { eq, sql, and, gte, lt, desc, asc, or, inArray } from "drizzle-orm";
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
  paymentAuditLogs,
  idempotencyKeys,
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

// Audit logging
export {
  createAuditLog,
  completeAuditLog,
  failAuditLog,
  updateAuditLogProcessing,
  refundAuditLog,
  markForRecovery,
  markRecovered,
  incrementRecoveryAttempts,
  getAuditLog,
  findAuditLogByIdempotencyKey,
} from "../lib/auditLogger";

// Idempotency
export {
  checkIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
  withIdempotency,
  cleanupExpiredKeys,
  generateIdempotencyKey,
  getOrGenerateIdempotencyKey,
} from "../lib/idempotency";
