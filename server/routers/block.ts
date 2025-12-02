import {
  protectedProcedure,
  router,
  z,
  sql,
  eq,
  getDb,
  blocks,
  ErrorMessages,
  assertDb,
  throwBadRequest,
} from "./_shared";

export const blockRouter = router({
  toggle: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throwBadRequest(ErrorMessages.CANNOT_BLOCK_SELF);
      }

      const db = await getDb();
      assertDb(db);

      const existing = await db.select()
        .from(blocks)
        .where(sql`${blocks.blockerId} = ${ctx.user.id} AND ${blocks.blockedId} = ${input.userId}`)
        .limit(1);

      if (existing.length > 0) {
        await db.delete(blocks)
          .where(sql`${blocks.blockerId} = ${ctx.user.id} AND ${blocks.blockedId} = ${input.userId}`);
        return { blocked: false };
      } else {
        await db.insert(blocks).values({
          blockerId: ctx.user.id,
          blockedId: input.userId,
        });
        return { blocked: true };
      }
    }),

  check: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { blocked: false };

      const existing = await db.select()
        .from(blocks)
        .where(sql`${blocks.blockerId} = ${ctx.user.id} AND ${blocks.blockedId} = ${input.userId}`)
        .limit(1);

      return { blocked: existing.length > 0 };
    }),

  getBlocked: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select()
      .from(blocks)
      .where(eq(blocks.blockerId, ctx.user.id))
      .orderBy(sql`${blocks.createdAt} DESC`);
  }),
});
