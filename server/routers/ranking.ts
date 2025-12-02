import {
  publicProcedure,
  router,
  z,
  sql,
  getDb,
  creators,
} from "./_shared";

export const rankingRouter = router({
  bySupport: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(creators)
        .orderBy(sql`${creators.totalSupport} DESC`)
        .limit(input.limit || 20);
    }),

  byFollowers: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(creators)
        .orderBy(sql`${creators.followerCount} DESC`)
        .limit(input.limit || 20);
    }),

  newest: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(creators)
        .orderBy(sql`${creators.createdAt} DESC`)
        .limit(input.limit || 20);
    }),
});
