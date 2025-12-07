import {
  protectedProcedure,
  router,
  z,
  sql,
  eq,
  and,
  getDb,
  assertDb,
} from "./_shared";
import { notifications, users, creators } from "../../drizzle/schema";

export const notificationRouter = router({
  // 通知一覧を取得
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().optional(), unreadOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const limit = input.limit || 50;
      const conditions = [eq(notifications.userId, ctx.user.id)];

      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, 0));
      }

      const results = await db
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          actorId: notifications.actorId,
          targetType: notifications.targetType,
          targetId: notifications.targetId,
          link: notifications.link,
          isRead: notifications.isRead,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(and(...conditions))
        .orderBy(sql`${notifications.createdAt} DESC`)
        .limit(limit);

      // アクターの情報を取得
      const actorIds = Array.from(new Set(results.filter(r => r.actorId).map(r => r.actorId!)));
      let actorMap: Map<number, { name: string | null; avatarUrl: string | null }> = new Map();

      if (actorIds.length > 0) {
        const actorUsers = await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(sql`${users.id} IN (${sql.join(actorIds.map(id => sql`${id}`), sql`, `)})`);

        const actorCreators = await db
          .select({ userId: creators.userId, displayName: creators.displayName, avatarUrl: creators.avatarUrl })
          .from(creators)
          .where(sql`${creators.userId} IN (${sql.join(actorIds.map(id => sql`${id}`), sql`, `)})`);

        const creatorMap = new Map(actorCreators.map(c => [c.userId, c]));

        for (const user of actorUsers) {
          const creator = creatorMap.get(user.id);
          actorMap.set(user.id, {
            name: creator?.displayName || user.name,
            avatarUrl: creator?.avatarUrl || null,
          });
        }
      }

      return results.map(n => ({
        ...n,
        actor: n.actorId ? actorMap.get(n.actorId) : null,
      }));
    }),

  // 未読数を取得
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    assertDb(db);

    const [result] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, 0)));

    return { count: result?.count || 0 };
  }),

  // 通知を既読にする
  markAsRead: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      if (input.ids.length === 0) return { success: true };

      await db
        .update(notifications)
        .set({ isRead: 1, readAt: new Date() })
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            sql`${notifications.id} IN (${sql.join(input.ids.map(id => sql`${id}`), sql`, `)})`
          )
        );

      return { success: true };
    }),

  // すべて既読にする
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    assertDb(db);

    await db
      .update(notifications)
      .set({ isRead: 1, readAt: new Date() })
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, 0)));

    return { success: true };
  }),

  // 通知を削除
  deleteNotification: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      await db
        .delete(notifications)
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));

      return { success: true };
    }),

  // すべての通知を削除
  deleteAllNotifications: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    assertDb(db);

    await db.delete(notifications).where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),
});

// 通知を作成するヘルパー関数（他のルーターから呼び出し用）
export async function createNotification(params: {
  userId: number;
  type: "follow" | "like" | "comment" | "tip" | "subscription" | "purchase" | "new_post" | "system";
  title: string;
  message?: string;
  actorId?: number;
  targetType?: string;
  targetId?: number;
  link?: string;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    actorId: params.actorId,
    targetType: params.targetType,
    targetId: params.targetId,
    link: params.link,
  });
}
