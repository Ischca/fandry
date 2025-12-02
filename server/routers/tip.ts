import {
  publicProcedure,
  protectedProcedure,
  router,
  z,
  eq,
  sql,
  getDb,
  creators,
  tips,
} from "./_shared";
import { createTip, getTipsByCreatorId } from "../db";

export const tipRouter = router({
  create: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      amount: z.number().min(100),
      message: z.string().optional(),
      isRecurring: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createTip({
        userId: ctx.user.id,
        creatorId: input.creatorId,
        amount: input.amount,
        message: input.message,
        isRecurring: input.isRecurring ? 1 : 0,
      });

      const db = await getDb();
      if (db) {
        await db.update(creators)
          .set({ totalSupport: sql`${creators.totalSupport} + ${input.amount}` })
          .where(eq(creators.id, input.creatorId));
      }

      return { success: true };
    }),

  getByCreatorId: publicProcedure
    .input(z.object({ creatorId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getTipsByCreatorId(input.creatorId, input.limit);
    }),

  getMyTips: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      if (!creator) return [];

      return db.select({
        id: tips.id,
        amount: tips.amount,
        message: tips.message,
        createdAt: tips.createdAt,
      })
        .from(tips)
        .where(eq(tips.creatorId, creator.id))
        .orderBy(sql`${tips.createdAt} DESC`)
        .limit(input.limit || 50);
    }),
});
