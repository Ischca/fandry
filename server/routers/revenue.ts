import {
  protectedProcedure,
  router,
  z,
  sql,
  eq,
  getDb,
  creators,
  tips,
  subscriptions,
  subscriptionPlans,
} from "./_shared";

export const revenueRouter = router({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
    if (!creator) return null;

    // Get total tips
    const tipResult = await db.select({
      total: sql`COALESCE(SUM(${tips.amount}), 0)`.mapWith(Number),
      count: sql`COUNT(*)`.mapWith(Number),
    })
      .from(tips)
      .where(eq(tips.creatorId, creator.id));

    // Get subscription count and revenue
    const [subResult] = await db.select({
      count: sql`COUNT(DISTINCT ${subscriptions.userId})`.mapWith(Number),
    })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(sql`${subscriptionPlans.creatorId} = ${creator.id} AND ${subscriptions.status} = 'active'`);

    // Get monthly recurring revenue (MRR)
    const [mrrResult] = await db.select({
      mrr: sql`COALESCE(SUM(${subscriptionPlans.price}), 0)`.mapWith(Number),
    })
      .from(subscriptions)
      .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .where(sql`${subscriptionPlans.creatorId} = ${creator.id} AND ${subscriptions.status} = 'active'`);

    return {
      totalSupport: creator.totalSupport,
      tipTotal: tipResult[0]?.total || 0,
      tipCount: tipResult[0]?.count || 0,
      activeSubscribers: subResult?.count || 0,
      mrr: mrrResult?.mrr || 0,
    };
  }),

  getRecentTransactions: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      if (!creator) return [];

      const recentTips = await db.select({
        id: tips.id,
        type: sql`'tip'`.as("type"),
        amount: tips.amount,
        message: tips.message,
        createdAt: tips.createdAt,
      })
        .from(tips)
        .where(eq(tips.creatorId, creator.id))
        .orderBy(sql`${tips.createdAt} DESC`)
        .limit(input.limit || 20);

      return recentTips;
    }),
});
