import {
  protectedProcedure,
  router,
  z,
  sql,
  eq,
  getDb,
  creators,
  tips,
  purchases,
  subscriptions,
  subscriptionPlans,
  posts,
  assertDb,
  throwBadRequest,
} from "./_shared";
import { users } from "../../drizzle/schema";

// 領収書生成用のヘルパー関数
function generateReceiptNumber(type: string, id: number, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const typePrefix = type === "tip" ? "T" : type === "purchase" ? "P" : "S";
  return `${typePrefix}${year}${month}-${String(id).padStart(6, "0")}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export const receiptRouter = router({
  // 自分の購入履歴（領収書用）を取得
  getMyPurchases: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const limit = input.limit || 50;

      // チップ履歴
      const tipResults = await db
        .select({
          id: tips.id,
          amount: tips.amount,
          createdAt: tips.createdAt,
          creatorId: tips.creatorId,
          creatorName: creators.displayName,
          creatorUsername: creators.username,
        })
        .from(tips)
        .innerJoin(creators, eq(tips.creatorId, creators.id))
        .where(eq(tips.userId, ctx.user.id))
        .orderBy(sql`${tips.createdAt} DESC`)
        .limit(limit);

      // コンテンツ購入履歴
      const purchaseResults = await db
        .select({
          id: purchases.id,
          amount: purchases.amount,
          createdAt: purchases.createdAt,
          postId: purchases.postId,
          postTitle: posts.title,
          creatorId: creators.id,
          creatorName: creators.displayName,
          creatorUsername: creators.username,
        })
        .from(purchases)
        .innerJoin(posts, eq(purchases.postId, posts.id))
        .innerJoin(creators, eq(posts.creatorId, creators.id))
        .where(eq(purchases.userId, ctx.user.id))
        .orderBy(sql`${purchases.createdAt} DESC`)
        .limit(limit);

      // サブスク履歴
      const subscriptionResults = await db
        .select({
          id: subscriptions.id,
          status: subscriptions.status,
          startedAt: subscriptions.startedAt,
          planId: subscriptions.planId,
          planName: subscriptionPlans.name,
          planPrice: subscriptionPlans.price,
          creatorId: creators.id,
          creatorName: creators.displayName,
          creatorUsername: creators.username,
        })
        .from(subscriptions)
        .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .innerJoin(creators, eq(subscriptionPlans.creatorId, creators.id))
        .where(eq(subscriptions.userId, ctx.user.id))
        .orderBy(sql`${subscriptions.startedAt} DESC`)
        .limit(limit);

      // すべての取引を統合
      const allTransactions = [
        ...tipResults.map((t) => ({
          id: t.id,
          type: "tip" as const,
          amount: t.amount,
          date: t.createdAt,
          creatorName: t.creatorName,
          creatorUsername: t.creatorUsername,
          description: `${t.creatorName}様へのチップ`,
          receiptNumber: generateReceiptNumber("tip", t.id, t.createdAt),
        })),
        ...purchaseResults.map((p) => ({
          id: p.id,
          type: "purchase" as const,
          amount: p.amount,
          date: p.createdAt,
          creatorName: p.creatorName,
          creatorUsername: p.creatorUsername,
          description: `コンテンツ購入: ${p.postTitle || "投稿"}`,
          receiptNumber: generateReceiptNumber("purchase", p.id, p.createdAt),
        })),
        ...subscriptionResults.map((s) => ({
          id: s.id,
          type: "subscription" as const,
          amount: s.planPrice,
          date: s.startedAt,
          creatorName: s.creatorName,
          creatorUsername: s.creatorUsername,
          description: `月額サブスクリプション: ${s.planName}`,
          receiptNumber: generateReceiptNumber("subscription", s.id, s.startedAt),
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return allTransactions;
    }),

  // 単一の領収書データを取得
  getReceipt: protectedProcedure
    .input(
      z.object({
        type: z.enum(["tip", "purchase", "subscription"]),
        id: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // ユーザー情報を取得
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throwBadRequest("ユーザーが見つかりません");
      }

      let receipt = null;

      if (input.type === "tip") {
        const [tip] = await db
          .select({
            id: tips.id,
            amount: tips.amount,
            createdAt: tips.createdAt,
            message: tips.message,
            creatorName: creators.displayName,
            creatorUsername: creators.username,
          })
          .from(tips)
          .innerJoin(creators, eq(tips.creatorId, creators.id))
          .where(eq(tips.id, input.id))
          .limit(1);

        if (!tip) {
          throwBadRequest("取引が見つかりません");
        }

        // 所有者チェック
        const [tipOwner] = await db
          .select({ userId: tips.userId })
          .from(tips)
          .where(eq(tips.id, input.id))
          .limit(1);

        if (tipOwner?.userId !== ctx.user.id) {
          throwBadRequest("この領収書にアクセスする権限がありません");
        }

        receipt = {
          receiptNumber: generateReceiptNumber("tip", tip.id, tip.createdAt),
          type: "tip" as const,
          amount: tip.amount,
          date: formatDate(tip.createdAt),
          rawDate: tip.createdAt,
          description: `${tip.creatorName}様へのチップ`,
          creatorName: tip.creatorName,
          creatorUsername: tip.creatorUsername,
          note: tip.message,
        };
      } else if (input.type === "purchase") {
        const [purchase] = await db
          .select({
            id: purchases.id,
            amount: purchases.amount,
            createdAt: purchases.createdAt,
            postTitle: posts.title,
            creatorName: creators.displayName,
            creatorUsername: creators.username,
          })
          .from(purchases)
          .innerJoin(posts, eq(purchases.postId, posts.id))
          .innerJoin(creators, eq(posts.creatorId, creators.id))
          .where(eq(purchases.id, input.id))
          .limit(1);

        if (!purchase) {
          throwBadRequest("取引が見つかりません");
        }

        // 所有者チェック
        const [purchaseOwner] = await db
          .select({ userId: purchases.userId })
          .from(purchases)
          .where(eq(purchases.id, input.id))
          .limit(1);

        if (purchaseOwner?.userId !== ctx.user.id) {
          throwBadRequest("この領収書にアクセスする権限がありません");
        }

        receipt = {
          receiptNumber: generateReceiptNumber("purchase", purchase.id, purchase.createdAt),
          type: "purchase" as const,
          amount: purchase.amount,
          date: formatDate(purchase.createdAt),
          rawDate: purchase.createdAt,
          description: `コンテンツ購入: ${purchase.postTitle || "投稿"}`,
          creatorName: purchase.creatorName,
          creatorUsername: purchase.creatorUsername,
        };
      } else if (input.type === "subscription") {
        const [sub] = await db
          .select({
            id: subscriptions.id,
            startedAt: subscriptions.startedAt,
            planName: subscriptionPlans.name,
            planPrice: subscriptionPlans.price,
            creatorName: creators.displayName,
            creatorUsername: creators.username,
          })
          .from(subscriptions)
          .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
          .innerJoin(creators, eq(subscriptionPlans.creatorId, creators.id))
          .where(eq(subscriptions.id, input.id))
          .limit(1);

        if (!sub) {
          throwBadRequest("取引が見つかりません");
        }

        // 所有者チェック
        const [subOwner] = await db
          .select({ userId: subscriptions.userId })
          .from(subscriptions)
          .where(eq(subscriptions.id, input.id))
          .limit(1);

        if (subOwner?.userId !== ctx.user.id) {
          throwBadRequest("この領収書にアクセスする権限がありません");
        }

        receipt = {
          receiptNumber: generateReceiptNumber("subscription", sub.id, sub.startedAt),
          type: "subscription" as const,
          amount: sub.planPrice,
          date: formatDate(sub.startedAt),
          rawDate: sub.startedAt,
          description: `月額サブスクリプション: ${sub.planName}`,
          creatorName: sub.creatorName,
          creatorUsername: sub.creatorUsername,
        };
      }

      if (!receipt) {
        throwBadRequest("領収書データを生成できませんでした");
      }

      return {
        receiptNumber: receipt.receiptNumber,
        type: receipt.type,
        amount: receipt.amount,
        date: receipt.date,
        rawDate: receipt.rawDate,
        description: receipt.description,
        creatorName: receipt.creatorName,
        creatorUsername: receipt.creatorUsername,
        note: "note" in receipt ? receipt.note : null,
        buyerName: user.name || "お客様",
        buyerEmail: user.email,
        serviceName: "Fandry",
        serviceUrl: "https://fandry.app",
      };
    }),
});
