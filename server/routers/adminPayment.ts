/**
 * 管理者用決済API
 * 監査ログの確認、失敗取引の復旧操作
 */
import {
  protectedProcedure,
  router,
  TRPCError,
  z,
  eq,
  sql,
  and,
  desc,
  getDb,
  paymentAuditLogs,
  userPoints,
  pointTransactions,
  assertDb,
  markRecovered,
  incrementRecoveryAttempts,
} from "./_shared";

// Helper: Check if user is admin
function assertAdmin(user: { role: string }) {
  if (user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "管理者権限が必要です",
    });
  }
}

export const adminPaymentRouter = router({
  // 監査ログ一覧取得（フィルタリング付き）
  getAuditLogs: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "processing", "completed", "failed", "refunded", "cancelled"]).optional(),
        operationType: z.string().optional(),
        userId: z.number().optional(),
        requiresRecovery: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      let query = db
        .select()
        .from(paymentAuditLogs)
        .orderBy(desc(paymentAuditLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Note: Complex filtering would require dynamic query building
      // For now, return all and filter in memory (not ideal for large datasets)
      const results = await query;

      return results.filter((log) => {
        if (input.status && log.status !== input.status) return false;
        if (input.operationType && log.operationType !== input.operationType) return false;
        if (input.userId && log.userId !== input.userId) return false;
        if (input.requiresRecovery !== undefined && (log.requiresRecovery === 1) !== input.requiresRecovery) return false;
        return true;
      });
    }),

  // 監査ログ詳細取得
  getAuditLogById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      const [log] = await db
        .select()
        .from(paymentAuditLogs)
        .where(eq(paymentAuditLogs.id, input.id));

      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND", message: "監査ログが見つかりません" });
      }

      return log;
    }),

  // 復旧待ち一覧取得
  getRecoveryQueue: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      return db
        .select()
        .from(paymentAuditLogs)
        .where(eq(paymentAuditLogs.requiresRecovery, 1))
        .orderBy(desc(paymentAuditLogs.createdAt))
        .limit(input.limit);
    }),

  // 失敗取引一覧
  getFailedTransactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      return db
        .select()
        .from(paymentAuditLogs)
        .where(eq(paymentAuditLogs.status, "failed"))
        .orderBy(desc(paymentAuditLogs.createdAt))
        .limit(input.limit);
    }),

  // 統計情報
  getTransactionStats: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.user);
    const db = await getDb();
    assertDb(db);

    // Get counts by status
    const statusCounts = await db
      .select({
        status: paymentAuditLogs.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(paymentAuditLogs)
      .groupBy(paymentAuditLogs.status);

    // Get recovery queue count
    const [recoveryCount] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(paymentAuditLogs)
      .where(eq(paymentAuditLogs.requiresRecovery, 1));

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats] = await db
      .select({
        total: sql<number>`count(*)`.mapWith(Number),
        completed: sql<number>`sum(case when ${paymentAuditLogs.status} = 'completed' then 1 else 0 end)`.mapWith(Number),
        failed: sql<number>`sum(case when ${paymentAuditLogs.status} = 'failed' then 1 else 0 end)`.mapWith(Number),
        totalAmount: sql<number>`sum(${paymentAuditLogs.totalAmount})`.mapWith(Number),
      })
      .from(paymentAuditLogs)
      .where(sql`${paymentAuditLogs.createdAt} >= ${today}`);

    return {
      statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s.count])),
      recoveryQueueCount: recoveryCount?.count || 0,
      today: {
        total: todayStats?.total || 0,
        completed: todayStats?.completed || 0,
        failed: todayStats?.failed || 0,
        totalAmount: todayStats?.totalAmount || 0,
      },
    };
  }),

  // 手動ポイント返金
  refundPoints: protectedProcedure
    .input(
      z.object({
        auditLogId: z.number(),
        amount: z.number().min(1),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      // Get audit log
      const [log] = await db
        .select()
        .from(paymentAuditLogs)
        .where(eq(paymentAuditLogs.id, input.auditLogId));

      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND", message: "監査ログが見つかりません" });
      }

      if (!log.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ユーザーIDが不明です" });
      }

      // Get or create user points
      let [points] = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, log.userId));

      if (!points) {
        const [inserted] = await db
          .insert(userPoints)
          .values({
            userId: log.userId,
            balance: 0,
            totalPurchased: 0,
            totalSpent: 0,
          })
          .returning();
        points = inserted;
      }

      const newBalance = points.balance + input.amount;

      // Credit points
      await db
        .update(userPoints)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, log.userId));

      // Record transaction
      await db.insert(pointTransactions).values({
        userId: log.userId,
        type: "refund",
        amount: input.amount,
        balanceAfter: newBalance,
        referenceId: input.auditLogId,
        description: `管理者返金: ${input.reason}`,
      });

      // Update audit log
      await db
        .update(paymentAuditLogs)
        .set({
          status: "refunded",
          adminNote: input.reason,
          processedBy: ctx.user.id,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(paymentAuditLogs.id, input.auditLogId));

      // Mark as recovered if was requiring recovery
      if (log.requiresRecovery === 1) {
        await markRecovered(input.auditLogId, ctx.user.id, input.reason);
      }

      return { success: true, newBalance };
    }),

  // 手動ポイント付与（補償用）
  grantPoints: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        amount: z.number().min(1),
        reason: z.string().min(1),
        relatedAuditLogId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      // Get or create user points
      let [points] = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, input.userId));

      if (!points) {
        const [inserted] = await db
          .insert(userPoints)
          .values({
            userId: input.userId,
            balance: 0,
            totalPurchased: 0,
            totalSpent: 0,
          })
          .returning();
        points = inserted;
      }

      const newBalance = points.balance + input.amount;

      // Credit points
      await db
        .update(userPoints)
        .set({
          balance: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, input.userId));

      // Record transaction
      await db.insert(pointTransactions).values({
        userId: input.userId,
        type: "admin_grant",
        amount: input.amount,
        balanceAfter: newBalance,
        referenceId: input.relatedAuditLogId,
        description: `管理者付与: ${input.reason}`,
      });

      // If related audit log, mark as recovered
      if (input.relatedAuditLogId) {
        await markRecovered(input.relatedAuditLogId, ctx.user.id, input.reason);
      }

      return { success: true, newBalance };
    }),

  // 解決済みとしてマーク
  markResolved: protectedProcedure
    .input(
      z.object({
        auditLogId: z.number(),
        note: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      const [log] = await db
        .select()
        .from(paymentAuditLogs)
        .where(eq(paymentAuditLogs.id, input.auditLogId));

      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND", message: "監査ログが見つかりません" });
      }

      await markRecovered(input.auditLogId, ctx.user.id, input.note);

      return { success: true };
    }),

  // ステータス手動修正
  updateTransactionStatus: protectedProcedure
    .input(
      z.object({
        auditLogId: z.number(),
        status: z.enum(["pending", "processing", "completed", "failed", "refunded", "cancelled"]),
        note: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      const [log] = await db
        .select()
        .from(paymentAuditLogs)
        .where(eq(paymentAuditLogs.id, input.auditLogId));

      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND", message: "監査ログが見つかりません" });
      }

      await db
        .update(paymentAuditLogs)
        .set({
          status: input.status,
          adminNote: `${log.adminNote || ""}\n[${new Date().toISOString()}] ステータス変更: ${log.status} -> ${input.status} - ${input.note}`,
          processedBy: ctx.user.id,
          processedAt: new Date(),
          updatedAt: new Date(),
          ...(input.status === "completed" ? { completedAt: new Date() } : {}),
        })
        .where(eq(paymentAuditLogs.id, input.auditLogId));

      return { success: true };
    }),

  // 復旧試行
  attemptRecovery: protectedProcedure
    .input(z.object({ auditLogId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.user);
      const db = await getDb();
      assertDb(db);

      const [log] = await db
        .select()
        .from(paymentAuditLogs)
        .where(eq(paymentAuditLogs.id, input.auditLogId));

      if (!log) {
        throw new TRPCError({ code: "NOT_FOUND", message: "監査ログが見つかりません" });
      }

      // Increment recovery attempts
      await incrementRecoveryAttempts(input.auditLogId);

      // Return log for manual inspection
      // Actual recovery logic would depend on the operation type
      return {
        log,
        message: "復旧試行が記録されました。手動での確認が必要です。",
      };
    }),
});
