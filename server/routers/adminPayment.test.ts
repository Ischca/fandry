import { describe, expect, it, beforeAll } from "vitest";
import { createMockAuthContext, createMockUser, createMockAdminUser, createTestUser } from "../test/helpers";
import { appRouter } from "../routers";

describe("adminPaymentRouter", () => {
  describe("authorization", () => {
    it("should reject non-admin users for getAuditLogs", async () => {
      const user = createMockUser({ id: 1, role: "user" });
      const ctx = createMockAuthContext(user);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.adminPayment.getAuditLogs({})
      ).rejects.toThrow("管理者権限が必要です");
    });

    it("should reject non-admin users for grantPoints", async () => {
      const user = createMockUser({ id: 1, role: "user" });
      const ctx = createMockAuthContext(user);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.adminPayment.grantPoints({
          userId: 2,
          amount: 1000,
          reason: "Test",
        })
      ).rejects.toThrow("管理者権限が必要です");
    });

    it("should reject non-admin users for getRecoveryQueue", async () => {
      const user = createMockUser({ id: 1, role: "user" });
      const ctx = createMockAuthContext(user);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.adminPayment.getRecoveryQueue({})
      ).rejects.toThrow("管理者権限が必要です");
    });
  });

  describe("getAuditLogs (admin)", () => {
    it("should return audit logs for admin", async () => {
      const { user } = await createTestUser("admin-audit");
      // Manually set role to admin in context
      const adminUser = { ...user, role: "admin" as const };
      const ctx = createMockAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminPayment.getAuditLogs({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const { user } = await createTestUser("admin-audit-limit");
      const adminUser = { ...user, role: "admin" as const };
      const ctx = createMockAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminPayment.getAuditLogs({ limit: 5 });

      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getTransactionStats (admin)", () => {
    it("should return transaction statistics", async () => {
      const { user } = await createTestUser("admin-stats");
      const adminUser = { ...user, role: "admin" as const };
      const ctx = createMockAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminPayment.getTransactionStats();

      expect(result).toHaveProperty("statusCounts");
      expect(result).toHaveProperty("recoveryQueueCount");
      expect(result).toHaveProperty("today");
      expect(result.today).toHaveProperty("total");
      expect(result.today).toHaveProperty("completed");
      expect(result.today).toHaveProperty("failed");
    });
  });

  describe("getRecoveryQueue (admin)", () => {
    it("should return recovery queue items", async () => {
      const { user } = await createTestUser("admin-recovery");
      const adminUser = { ...user, role: "admin" as const };
      const ctx = createMockAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminPayment.getRecoveryQueue({});

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getFailedTransactions (admin)", () => {
    it("should return failed transactions", async () => {
      const { user } = await createTestUser("admin-failed");
      const adminUser = { ...user, role: "admin" as const };
      const ctx = createMockAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminPayment.getFailedTransactions({});

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("grantPoints (admin)", () => {
    it("should grant points to user", async () => {
      const { user: targetUser } = await createTestUser("admin-grant-target");
      const { user: adminUser } = await createTestUser("admin-grant-admin");
      const admin = { ...adminUser, role: "admin" as const };
      const ctx = createMockAuthContext(admin);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminPayment.grantPoints({
        userId: targetUser.id,
        amount: 1000,
        reason: "Compensation for issue #123",
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1000);
    });

    it("should accumulate points for existing balance", async () => {
      const { user: targetUser, caller: targetCaller } = await createTestUser("admin-grant-accum");

      // Target user has existing balance
      await targetCaller.point.creditPoints({ amount: 500 });

      const { user: adminUser } = await createTestUser("admin-grant-accum-admin");
      const admin = { ...adminUser, role: "admin" as const };
      const ctx = createMockAuthContext(admin);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminPayment.grantPoints({
        userId: targetUser.id,
        amount: 300,
        reason: "Bonus points",
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(800);
    });
  });

  describe("getAuditLogById (admin)", () => {
    it("should throw error for non-existent log", async () => {
      const { user } = await createTestUser("admin-log-notfound");
      const adminUser = { ...user, role: "admin" as const };
      const ctx = createMockAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.adminPayment.getAuditLogById({ id: 999999 })
      ).rejects.toThrow("監査ログが見つかりません");
    });
  });

  describe("markResolved (admin)", () => {
    it("should throw error for non-existent log", async () => {
      const { user } = await createTestUser("admin-resolve-notfound");
      const adminUser = { ...user, role: "admin" as const };
      const ctx = createMockAuthContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.adminPayment.markResolved({
          auditLogId: 999999,
          note: "Resolved manually",
        })
      ).rejects.toThrow("監査ログが見つかりません");
    });
  });
});
