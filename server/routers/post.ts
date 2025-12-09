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
  getFollowersByCreatorId,
} from "../db";
import { createNotification } from "./notification";

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
      previewContent: z.string().optional(), // プレビューコンテンツ
      type: z.enum(["free", "paid", "membership"]),
      price: z.number().optional(),
      membershipTier: z.number().optional(),
      mediaUrls: z.string().optional(),
      previewMediaUrls: z.string().optional(), // プレビュー用メディアURL
      scheduledAt: z.string().datetime().optional(), // ISO8601形式
    }))
    .mutation(async ({ ctx, input }) => {
      const creator = await getDb().then(db =>
        db?.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1)
      );
      assertCreator(creator?.[0]);

      const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      const isScheduled = scheduledAt && scheduledAt > new Date();

      const newPost = await createPost({
        creatorId: creator[0].id,
        title: input.title,
        content: input.content,
        previewContent: input.previewContent,
        type: input.type,
        price: input.price,
        membershipTier: input.membershipTier,
        mediaUrls: input.mediaUrls,
        previewMediaUrls: input.previewMediaUrls,
        scheduledAt: scheduledAt,
        publishedAt: isScheduled ? null : new Date(), // 即時公開の場合のみpublishedAtを設定
      });

      // Send notifications to all followers (only for immediate publish)
      if (!isScheduled) {
        const followerIds = await getFollowersByCreatorId(creator[0].id);
        const notificationPromises = followerIds.map(followerId =>
          createNotification({
            userId: followerId,
            type: "new_post",
            title: "新しい投稿",
            message: input.title || input.content.slice(0, 50),
            actorId: ctx.user.id,
            targetType: "post",
            targetId: newPost.id,
            link: `/@${creator[0].username}/posts/${newPost.id}`,
          })
        );
        await Promise.all(notificationPromises);
      }

      return { success: true, postId: newPost.id, isScheduled };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().max(256).optional(),
      content: z.string().optional(),
      previewContent: z.string().optional().nullable(), // プレビューコンテンツ（nullで削除）
      type: z.enum(["free", "paid", "membership"]).optional(),
      price: z.number().optional(),
      membershipTier: z.number().optional(),
      mediaUrls: z.string().optional(),
      previewMediaUrls: z.string().optional().nullable(), // プレビュー用メディアURL
      scheduledAt: z.string().datetime().optional().nullable(), // nullで即時公開に変更
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      assertCreator(creator);

      const [post] = await db.select().from(posts).where(eq(posts.id, input.id)).limit(1);
      assertFound(post, ErrorMessages.POST_NOT_FOUND);
      assertOwnership(post.creatorId, creator.id, ErrorMessages.NOT_YOUR_POST);

      const { id, scheduledAt: scheduledAtInput, ...updateData } = input;
      const updateSet: Record<string, unknown> = {
        ...updateData,
        updatedAt: new Date(),
      };

      // scheduledAtの処理
      if (scheduledAtInput !== undefined) {
        if (scheduledAtInput === null) {
          // 予約を解除して即時公開
          updateSet.scheduledAt = null;
          if (!post.publishedAt) {
            updateSet.publishedAt = new Date();
          }
        } else {
          const scheduledAt = new Date(scheduledAtInput);
          updateSet.scheduledAt = scheduledAt;
          // 未来の日時なら公開を取り消し
          if (scheduledAt > new Date()) {
            updateSet.publishedAt = null;
          }
        }
      }

      await db.update(posts).set(updateSet).where(eq(posts.id, id));

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
    .input(z.object({ limit: z.number().optional(), filter: z.enum(["all", "published", "scheduled"]).optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      if (!creator) return [];

      let conditions;
      switch (input.filter) {
        case "published":
          conditions = sql`${posts.creatorId} = ${creator.id} AND ${posts.publishedAt} IS NOT NULL`;
          break;
        case "scheduled":
          conditions = sql`${posts.creatorId} = ${creator.id} AND ${posts.scheduledAt} IS NOT NULL AND ${posts.publishedAt} IS NULL`;
          break;
        default:
          conditions = eq(posts.creatorId, creator.id);
      }

      return db.select()
        .from(posts)
        .where(conditions)
        .orderBy(sql`${posts.createdAt} DESC`)
        .limit(input.limit || 50);
    }),
});
