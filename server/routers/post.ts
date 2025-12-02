import {
  publicProcedure,
  protectedProcedure,
  router,
  z,
  eq,
  sql,
  getDb,
  creators,
  posts,
  ErrorMessages,
  assertDb,
  assertFound,
  assertCreator,
  assertOwnership,
} from "./_shared";
import {
  getCreatorByUsername,
  getPostsByCreatorId,
  getPostWithAccess,
  createPost,
} from "../db";

export const postRouter = router({
  getByCreatorUsername: publicProcedure
    .input(z.object({ username: z.string(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      const creator = await getCreatorByUsername(input.username);
      if (!creator) return [];
      return getPostsByCreatorId(creator.id, input.limit);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      const post = await getPostWithAccess(input.id, userId);
      assertFound(post, ErrorMessages.POST_NOT_FOUND);
      return post;
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().max(256).optional(),
      content: z.string(),
      type: z.enum(["free", "paid", "membership"]),
      price: z.number().optional(),
      membershipTier: z.number().optional(),
      mediaUrls: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const creator = await getDb().then(db =>
        db?.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1)
      );
      assertCreator(creator?.[0]);
      await createPost({
        creatorId: creator[0].id,
        title: input.title,
        content: input.content,
        type: input.type,
        price: input.price,
        membershipTier: input.membershipTier,
        mediaUrls: input.mediaUrls,
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().max(256).optional(),
      content: z.string().optional(),
      type: z.enum(["free", "paid", "membership"]).optional(),
      price: z.number().optional(),
      membershipTier: z.number().optional(),
      mediaUrls: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      assertCreator(creator);

      const [post] = await db.select().from(posts).where(eq(posts.id, input.id)).limit(1);
      assertFound(post, ErrorMessages.POST_NOT_FOUND);
      assertOwnership(post.creatorId, creator.id, ErrorMessages.NOT_YOUR_POST);

      const { id, ...updateData } = input;
      await db.update(posts).set({
        ...updateData,
        updatedAt: new Date(),
      }).where(eq(posts.id, id));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      assertCreator(creator);

      const [post] = await db.select().from(posts).where(eq(posts.id, input.id)).limit(1);
      assertFound(post, ErrorMessages.POST_NOT_FOUND);
      assertOwnership(post.creatorId, creator.id, ErrorMessages.NOT_YOUR_POST);

      await db.delete(posts).where(eq(posts.id, input.id));
      return { success: true };
    }),

  getMyPosts: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      if (!creator) return [];

      return db.select()
        .from(posts)
        .where(eq(posts.creatorId, creator.id))
        .orderBy(sql`${posts.createdAt} DESC`)
        .limit(input.limit || 50);
    }),
});
