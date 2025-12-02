// Unified error handling utilities
import { TRPCError } from "@trpc/server";

// Error messages constants
export const ErrorMessages = {
  DB_NOT_AVAILABLE: "Database not available",
  CREATOR_NOT_FOUND: "Creator profile not found",
  CREATOR_REQUIRED: "You must be a creator",
  POST_NOT_FOUND: "Post not found",
  PLAN_NOT_FOUND: "Plan not found",
  NOT_YOUR_POST: "Not your post",
  NOT_YOUR_PLAN: "Not your plan",
  USERNAME_TAKEN: "Username already taken",
  TIER_EXISTS: "This tier level already exists",
  ALREADY_REPORTED: "You have already reported this",
  CANNOT_BLOCK_SELF: "Cannot block yourself",
  INVALID_FILE_TYPE: "Invalid file type",
} as const;

// Throw helpers for common errors
export function assertDb<T>(db: T | null | undefined): asserts db is T {
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: ErrorMessages.DB_NOT_AVAILABLE });
  }
}

export function assertFound<T>(resource: T | null | undefined, message: string): asserts resource is T {
  if (!resource) {
    throw new TRPCError({ code: "NOT_FOUND", message });
  }
}

export function assertCreator<T>(creator: T | null | undefined): asserts creator is T {
  if (!creator) {
    throw new TRPCError({ code: "FORBIDDEN", message: ErrorMessages.CREATOR_REQUIRED });
  }
}

export function assertOwnership(ownerId: number, expectedOwnerId: number, message: string): void {
  if (ownerId !== expectedOwnerId) {
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
}

export function throwConflict(message: string): never {
  throw new TRPCError({ code: "CONFLICT", message });
}

export function throwBadRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}
