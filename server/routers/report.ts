import {
  protectedProcedure,
  router,
  z,
  sql,
  getDb,
  reports,
  ErrorMessages,
  assertDb,
  throwConflict,
} from "./_shared";

export const reportRouter = router({
  create: protectedProcedure
    .input(z.object({
      targetType: z.enum(["post", "creator", "comment"]),
      targetId: z.number(),
      type: z.enum(["spam", "harassment", "inappropriate_content", "copyright", "other"]),
      reason: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const existing = await db.select()
        .from(reports)
        .where(sql`${reports.reporterId} = ${ctx.user.id} AND ${reports.targetType} = ${input.targetType} AND ${reports.targetId} = ${input.targetId}`)
        .limit(1);

      if (existing.length > 0) {
        throwConflict(ErrorMessages.ALREADY_REPORTED);
      }

      await db.insert(reports).values({
        reporterId: ctx.user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        type: input.type,
        reason: input.reason,
      });

      return { success: true };
    }),
});
