import {
  publicProcedure,
  protectedProcedure,
  router,
  z,
  eq,
  sql,
  getDb,
  creators,
  subscriptionPlans,
  ErrorMessages,
  assertDb,
  assertFound,
  assertCreator,
  assertOwnership,
  throwConflict,
} from "./_shared";
import { getSubscriptionPlansByCreatorId } from "../db";

export const subscriptionPlanRouter = router({
  getByCreatorId: publicProcedure
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ input }) => {
      return await getSubscriptionPlansByCreatorId(input.creatorId);
    }),

  getMyPlans: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
    if (!creator) return [];

    return db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.creatorId, creator.id))
      .orderBy(sql`${subscriptionPlans.tier} ASC`);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      description: z.string().max(1000).optional(),
      price: z.number().min(100).max(100000),
      tier: z.number().min(1).max(10),
      benefits: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      assertCreator(creator);

      const [existingTier] = await db.select()
        .from(subscriptionPlans)
        .where(sql`${subscriptionPlans.creatorId} = ${creator.id} AND ${subscriptionPlans.tier} = ${input.tier}`)
        .limit(1);

      if (existingTier) {
        throwConflict(ErrorMessages.TIER_EXISTS);
      }

      const [inserted] = await db.insert(subscriptionPlans).values({
        creatorId: creator.id,
        name: input.name,
        description: input.description,
        price: input.price,
        tier: input.tier,
        benefits: input.benefits,
      }).returning();

      return inserted;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(128).optional(),
      description: z.string().max(1000).optional(),
      price: z.number().min(100).max(100000).optional(),
      benefits: z.string().optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      assertCreator(creator);

      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, input.id)).limit(1);
      assertFound(plan, ErrorMessages.PLAN_NOT_FOUND);
      assertOwnership(plan.creatorId, creator.id, ErrorMessages.NOT_YOUR_PLAN);

      const { id, ...updateData } = input;
      await db.update(subscriptionPlans).set({
        ...updateData,
        updatedAt: new Date(),
      }).where(eq(subscriptionPlans.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      assertCreator(creator);

      const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, input.id)).limit(1);
      assertFound(plan, ErrorMessages.PLAN_NOT_FOUND);
      assertOwnership(plan.creatorId, creator.id, ErrorMessages.NOT_YOUR_PLAN);

      await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, input.id));
      return { success: true };
    }),
});
