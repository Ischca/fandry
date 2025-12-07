import {
  protectedProcedure,
  router,
  z,
  sql,
  eq,
  and,
  gte,
  getDb,
  creators,
  tips,
  purchases,
  posts,
  subscriptions,
  subscriptionPlans,
} from "./_shared";

export const revenueRouter = router({
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
    if (!creator) return null;

    // Date ranges
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get total tips
    const tipResult = await db.select({
      total: sql`COALESCE(SUM(${tips.amount}), 0)`.mapWith(Number),
      count: sql`COUNT(*)`.mapWith(Number),
    })
      .from(tips)
      .where(eq(tips.creatorId, creator.id));

    // Get tips this month
    const [tipsThisMonth] = await db.select({
      total: sql`COALESCE(SUM(${tips.amount}), 0)`.mapWith(Number),
    })
      .from(tips)
      .where(and(eq(tips.creatorId, creator.id), gte(tips.createdAt, thisMonthStart)));

    // Get tips last month
    const [tipsLastMonth] = await db.select({
      total: sql`COALESCE(SUM(${tips.amount}), 0)`.mapWith(Number),
    })
      .from(tips)
      .where(and(
        eq(tips.creatorId, creator.id),
        gte(tips.createdAt, lastMonthStart),
        sql`${tips.createdAt} <= ${lastMonthEnd}`
      ));

    // Get creator's posts for purchase calculation
    const creatorPosts = await db.select({ id: posts.id }).from(posts).where(eq(posts.creatorId, creator.id));
    const postIds = creatorPosts.map(p => p.id);

    let purchasesThisMonth = 0;
    let purchasesLastMonth = 0;
    let purchasesTotal = 0;

    if (postIds.length > 0) {
      const postIdList = sql.join(postIds.map(id => sql`${id}`), sql`, `);

      const [purchaseTotal] = await db.select({
        total: sql`COALESCE(SUM(${purchases.amount}), 0)`.mapWith(Number),
      })
        .from(purchases)
        .where(sql`${purchases.postId} IN (${postIdList})`);
      purchasesTotal = purchaseTotal?.total || 0;

      const [purchaseThisMonth] = await db.select({
        total: sql`COALESCE(SUM(${purchases.amount}), 0)`.mapWith(Number),
      })
        .from(purchases)
        .where(and(
          sql`${purchases.postId} IN (${postIdList})`,
          gte(purchases.createdAt, thisMonthStart)
        ));
      purchasesThisMonth = purchaseThisMonth?.total || 0;

      const [purchaseLastMonth] = await db.select({
        total: sql`COALESCE(SUM(${purchases.amount}), 0)`.mapWith(Number),
      })
        .from(purchases)
        .where(and(
          sql`${purchases.postId} IN (${postIdList})`,
          gte(purchases.createdAt, lastMonthStart),
          sql`${purchases.createdAt} <= ${lastMonthEnd}`
        ));
      purchasesLastMonth = purchaseLastMonth?.total || 0;
    }

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

    const mrr = mrrResult?.mrr || 0;
    const thisMonthTotal = (tipsThisMonth?.total || 0) + purchasesThisMonth + mrr;
    const lastMonthTotal = (tipsLastMonth?.total || 0) + purchasesLastMonth + mrr;

    return {
      totalSupport: creator.totalSupport,
      tipTotal: tipResult[0]?.total || 0,
      tipCount: tipResult[0]?.count || 0,
      purchasesTotal,
      activeSubscribers: subResult?.count || 0,
      mrr,
      thisMonth: {
        total: thisMonthTotal,
        tips: tipsThisMonth?.total || 0,
        purchases: purchasesThisMonth,
        subscriptions: mrr,
      },
      lastMonth: {
        total: lastMonthTotal,
        tips: tipsLastMonth?.total || 0,
        purchases: purchasesLastMonth,
      },
      followerCount: creator.followerCount,
    };
  }),

  getRecentTransactions: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      if (!creator) return [];

      const limit = input.limit || 20;

      // Get recent tips
      const recentTips = await db.select({
        id: tips.id,
        type: sql<string>`'tip'`.as("type"),
        amount: tips.amount,
        message: tips.message,
        createdAt: tips.createdAt,
      })
        .from(tips)
        .where(eq(tips.creatorId, creator.id))
        .orderBy(sql`${tips.createdAt} DESC`)
        .limit(limit);

      // Get creator's posts
      const creatorPosts = await db.select({ id: posts.id, title: posts.title }).from(posts).where(eq(posts.creatorId, creator.id));
      const postIds = creatorPosts.map(p => p.id);
      const postTitles = new Map(creatorPosts.map(p => [p.id, p.title]));

      let recentPurchases: Array<{ id: number; type: string; amount: number; message: string | null; createdAt: Date }> = [];

      if (postIds.length > 0) {
        const postIdList = sql.join(postIds.map(id => sql`${id}`), sql`, `);
        const purchaseResults = await db.select({
          id: purchases.id,
          amount: purchases.amount,
          postId: purchases.postId,
          createdAt: purchases.createdAt,
        })
          .from(purchases)
          .where(sql`${purchases.postId} IN (${postIdList})`)
          .orderBy(sql`${purchases.createdAt} DESC`)
          .limit(limit);

        recentPurchases = purchaseResults.map(p => ({
          id: p.id,
          type: "purchase",
          amount: p.amount,
          message: postTitles.get(p.postId) || "投稿購入",
          createdAt: p.createdAt,
        }));
      }

      // Combine and sort
      const allTransactions = [
        ...recentTips.map(t => ({ ...t, type: "tip" as const })),
        ...recentPurchases,
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

      return allTransactions;
    }),

  getSubscribers: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      if (!creator) return [];

      const subscribers = await db.select({
        id: subscriptions.id,
        planId: subscriptions.planId,
        planName: subscriptionPlans.name,
        planPrice: subscriptionPlans.price,
        status: subscriptions.status,
        startedAt: subscriptions.startedAt,
        nextBillingAt: subscriptions.nextBillingAt,
      })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptionPlans.creatorId, creator.id),
          eq(subscriptions.status, "active")
        ))
        .orderBy(sql`${subscriptions.startedAt} DESC`)
        .limit(input.limit || 50);

      return subscribers;
    }),
});
