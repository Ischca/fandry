// Purchase router - handles paid content purchases
import {
  protectedProcedure,
  router,
  TRPCError,
  z,
  eq,
  and,
  sql,
  getDb,
  posts,
  creators,
  purchases,
  userPoints,
  pointTransactions,
  assertDb,
  assertFound,
  createAuditLog,
  completeAuditLog,
  failAuditLog,
  getOrGenerateIdempotencyKey,
} from "./_shared";
import Stripe from "stripe";

// Stripe client (lazy initialization)
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });
    }
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

// Helper: Check if post is adult content
async function isAdultContent(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, post: { creatorId: number; isAdult: number }): Promise<boolean> {
  // Check post-level flag
  if (post.isAdult === 1) return true;

  // Check creator-level flag
  const [creator] = await db.select().from(creators).where(eq(creators.id, post.creatorId)).limit(1);
  return creator?.isAdult === 1;
}

// Helper: Get user's point balance
async function getUserBalance(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number): Promise<number> {
  const [points] = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);
  return points?.balance ?? 0;
}

// Helper: Deduct points from user
async function deductPoints(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  amount: number,
  referenceId: number,
  description: string
): Promise<number> {
  // Get current balance
  let [points] = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);

  if (!points) {
    // Create new record with 0 balance
    const [inserted] = await db.insert(userPoints).values({
      userId,
      balance: 0,
      totalPurchased: 0,
      totalSpent: 0,
    }).returning();
    points = inserted;
  }

  if (points.balance < amount) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "ポイント残高が不足しています" });
  }

  const newBalance = points.balance - amount;

  // Update balance
  await db.update(userPoints)
    .set({
      balance: newBalance,
      totalSpent: points.totalSpent + amount,
      updatedAt: new Date(),
    })
    .where(eq(userPoints.userId, userId));

  // Record transaction
  await db.insert(pointTransactions).values({
    userId,
    type: "post_purchase",
    amount: -amount,
    balanceAfter: newBalance,
    referenceId,
    description,
  });

  return newBalance;
}

export const purchaseRouter = router({
  // Check if user has purchased a post
  checkPurchase: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { purchased: false };

      const [purchase] = await db.select()
        .from(purchases)
        .where(and(
          eq(purchases.userId, ctx.user.id),
          eq(purchases.postId, input.postId)
        ))
        .limit(1);

      return { purchased: !!purchase };
    }),

  // Get purchase options for a post (paid or back number)
  getPurchaseOptions: protectedProcedure
    .input(z.object({
      postId: z.number(),
      purchaseType: z.enum(["paid", "backNumber"]).optional().default("paid"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post with creator info
      const [post] = await db.select({
        id: posts.id,
        type: posts.type,
        price: posts.price,
        backNumberPrice: posts.backNumberPrice,
        isAdult: posts.isAdult,
        creatorId: posts.creatorId,
        creatorIsAdult: creators.isAdult,
        creatorUsername: creators.username,
        creatorDisplayName: creators.displayName,
      })
        .from(posts)
        .leftJoin(creators, eq(posts.creatorId, creators.id))
        .where(eq(posts.id, input.postId))
        .limit(1);

      assertFound(post, "Post not found");

      // Determine price based on purchase type
      let purchasePrice: number | null;
      if (input.purchaseType === "backNumber") {
        // Back number purchase for membership posts
        if (post.type !== "membership") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "この投稿はバックナンバー購入できません" });
        }
        if (post.backNumberPrice === null) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "この投稿はバックナンバー販売されていません" });
        }
        purchasePrice = post.backNumberPrice;
      } else {
        // Regular paid post purchase
        if (post.type !== "paid") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "この投稿は購入できません" });
        }
        purchasePrice = post.price;
      }

      if (purchasePrice === null || purchasePrice === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This post is free" });
      }

      // Check if already purchased
      const [existingPurchase] = await db.select()
        .from(purchases)
        .where(and(
          eq(purchases.userId, ctx.user.id),
          eq(purchases.postId, input.postId)
        ))
        .limit(1);

      if (existingPurchase) {
        return { alreadyPurchased: true, post };
      }

      const isAdult = post.isAdult === 1 || post.creatorIsAdult === 1;
      const userBalance = await getUserBalance(db, ctx.user.id);

      return {
        alreadyPurchased: false,
        post: {
          id: post.id,
          type: post.type,
          price: purchasePrice,
          creatorUsername: post.creatorUsername,
          creatorDisplayName: post.creatorDisplayName,
        },
        purchaseType: input.purchaseType,
        isAdult,
        userBalance,
        // Available payment methods based on content type
        paymentMethods: isAdult
          ? ["points"] // Adult content: points only
          : ["points", "stripe", "hybrid"], // Non-adult: all methods
      };
    }),

  // Purchase with points only (for adult content or by choice)
  purchaseWithPoints: protectedProcedure
    .input(z.object({
      postId: z.number(),
      purchaseType: z.enum(["paid", "backNumber"]).optional().default("paid"),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post
      const [post] = await db.select({
        id: posts.id,
        type: posts.type,
        price: posts.price,
        backNumberPrice: posts.backNumberPrice,
        isAdult: posts.isAdult,
        creatorId: posts.creatorId,
        title: posts.title,
      })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      assertFound(post, "Post not found");

      // Determine price based on purchase type
      let purchasePrice: number;
      if (input.purchaseType === "backNumber") {
        if (post.type !== "membership" || post.backNumberPrice === null) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "この投稿はバックナンバー購入できません" });
        }
        purchasePrice = post.backNumberPrice;
      } else {
        if (post.type !== "paid" || post.price === null || post.price === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This post is free" });
        }
        purchasePrice = post.price;
      }

      // Check if already purchased
      const [existingPurchase] = await db.select()
        .from(purchases)
        .where(and(
          eq(purchases.userId, ctx.user.id),
          eq(purchases.postId, input.postId)
        ))
        .limit(1);

      if (existingPurchase) {
        throw new TRPCError({ code: "CONFLICT", message: "Already purchased" });
      }

      // Generate idempotency key
      const operationType = input.purchaseType === "backNumber" ? "back_number_purchase_points" : "post_purchase_points";
      const idemKey = getOrGenerateIdempotencyKey(
        input.idempotencyKey,
        operationType,
        ctx.user.id,
        input.postId
      );

      // Create audit log
      const auditLogId = await createAuditLog({
        operationType,
        userId: ctx.user.id,
        creatorId: post.creatorId,
        totalAmount: purchasePrice,
        pointsAmount: purchasePrice,
        idempotencyKey: idemKey,
      });

      try {
        // Create purchase record
        const [purchase] = await db.insert(purchases).values({
          userId: ctx.user.id,
          postId: input.postId,
          amount: purchasePrice,
          paymentMethod: "points",
          pointsUsed: purchasePrice,
          stripeAmount: 0,
          idempotencyKey: idemKey,
        }).returning();

        // Deduct points
        const purchaseLabel = input.purchaseType === "backNumber" ? "バックナンバー購入" : "投稿購入";
        const newBalance = await deductPoints(
          db,
          ctx.user.id,
          purchasePrice,
          purchase.id,
          `${purchaseLabel}: ${post.title || `Post #${post.id}`}`
        );

        // Update creator's total support
        await db.update(creators)
          .set({ totalSupport: sql`${creators.totalSupport} + ${purchasePrice}` })
          .where(eq(creators.id, post.creatorId));

        // Complete audit log
        await completeAuditLog(auditLogId, {
          referenceType: "purchase",
          referenceId: purchase.id,
        });

        return { success: true, purchaseId: purchase.id, newBalance };
      } catch (error) {
        // Log failure with recovery flag if points were deducted
        await failAuditLog(auditLogId, {
          code: error instanceof TRPCError ? error.code : "UNKNOWN",
          message: error instanceof Error ? error.message : "Unknown error",
        }, false);
        throw error;
      }
    }),

  // Create Stripe checkout for non-adult content direct purchase
  createStripeCheckout: protectedProcedure
    .input(z.object({
      postId: z.number(),
      purchaseType: z.enum(["paid", "backNumber"]).optional().default("paid"),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post with creator info
      const [post] = await db.select({
        id: posts.id,
        type: posts.type,
        price: posts.price,
        backNumberPrice: posts.backNumberPrice,
        isAdult: posts.isAdult,
        creatorId: posts.creatorId,
        title: posts.title,
      })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      assertFound(post, "Post not found");

      // Determine price and operation type based on purchase type
      let purchasePrice: number;
      let operationType: "post_purchase_stripe" | "back_number_purchase_stripe";
      let webhookType: string;
      let purchaseLabel: string;

      if (input.purchaseType === "backNumber") {
        if (post.type !== "membership" || post.backNumberPrice === null) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "この投稿はバックナンバー購入できません" });
        }
        purchasePrice = post.backNumberPrice;
        operationType = "back_number_purchase_stripe";
        webhookType = "back_number_purchase";
        purchaseLabel = "バックナンバー購入";
      } else {
        if (post.type !== "paid" || post.price === null || post.price === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This post is free" });
        }
        purchasePrice = post.price;
        operationType = "post_purchase_stripe";
        webhookType = "post_purchase";
        purchaseLabel = "コンテンツ購入";
      }

      // Check if adult content
      const isAdult = await isAdultContent(db, post);
      if (isAdult) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "アダルトコンテンツはポイントでのみ購入可能です"
        });
      }

      // Check if already purchased
      const [existingPurchase] = await db.select()
        .from(purchases)
        .where(and(
          eq(purchases.userId, ctx.user.id),
          eq(purchases.postId, input.postId)
        ))
        .limit(1);

      if (existingPurchase) {
        throw new TRPCError({ code: "CONFLICT", message: "Already purchased" });
      }

      // Generate idempotency key
      const idemKey = getOrGenerateIdempotencyKey(
        input.idempotencyKey,
        operationType,
        ctx.user.id,
        input.postId
      );

      // Create audit log (pending state - will be completed by webhook)
      const auditLogId = await createAuditLog({
        operationType,
        userId: ctx.user.id,
        creatorId: post.creatorId,
        totalAmount: purchasePrice,
        stripeAmount: purchasePrice,
        idempotencyKey: idemKey,
      });

      try {
        const stripe = getStripe();

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "jpy",
                product_data: {
                  name: post.title || `Post #${post.id}`,
                  description: purchaseLabel,
                },
                unit_amount: purchasePrice,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: ctx.user.id.toString(),
            postId: post.id.toString(),
            creatorId: post.creatorId.toString(),
            type: webhookType,
            amount: purchasePrice.toString(),
            auditLogId: auditLogId.toString(),
            idempotencyKey: idemKey,
          },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        });

        return { sessionId: session.id, url: session.url };
      } catch (error) {
        await failAuditLog(auditLogId, {
          code: "STRIPE_ERROR",
          message: error instanceof Error ? error.message : "Stripe error",
        }, false);
        throw error;
      }
    }),

  // Create hybrid payment (points + Stripe for remaining)
  createHybridCheckout: protectedProcedure
    .input(z.object({
      postId: z.number(),
      purchaseType: z.enum(["paid", "backNumber"]).optional().default("paid"),
      pointsToUse: z.number().min(0).max(1_000_000_000),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post
      const [post] = await db.select({
        id: posts.id,
        type: posts.type,
        price: posts.price,
        backNumberPrice: posts.backNumberPrice,
        isAdult: posts.isAdult,
        creatorId: posts.creatorId,
        title: posts.title,
      })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      assertFound(post, "Post not found");

      // Determine price and labels based on purchase type
      let purchasePrice: number;
      let purchaseLabel: string;
      let isBackNumber: boolean;

      if (input.purchaseType === "backNumber") {
        if (post.type !== "membership" || post.backNumberPrice === null) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "この投稿はバックナンバー購入できません" });
        }
        purchasePrice = post.backNumberPrice;
        purchaseLabel = "バックナンバー購入";
        isBackNumber = true;
      } else {
        if (post.type !== "paid" || post.price === null || post.price === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This post is free" });
        }
        purchasePrice = post.price;
        purchaseLabel = "投稿購入";
        isBackNumber = false;
      }

      // Check if adult content
      const isAdult = await isAdultContent(db, post);
      if (isAdult) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "アダルトコンテンツはポイントでのみ購入可能です"
        });
      }

      // Check user balance
      const userBalance = await getUserBalance(db, ctx.user.id);
      if (input.pointsToUse > userBalance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ポイント残高が不足しています" });
      }

      if (input.pointsToUse > purchasePrice) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "使用ポイントが価格を超えています" });
      }

      // Check if already purchased
      const [existingPurchase] = await db.select()
        .from(purchases)
        .where(and(
          eq(purchases.userId, ctx.user.id),
          eq(purchases.postId, input.postId)
        ))
        .limit(1);

      if (existingPurchase) {
        throw new TRPCError({ code: "CONFLICT", message: "Already purchased" });
      }

      const stripeAmount = purchasePrice - input.pointsToUse;

      // Determine operation types
      const pointsOperationType = isBackNumber ? "back_number_purchase_points" : "post_purchase_points";
      const hybridOperationType = isBackNumber ? "back_number_purchase_hybrid" : "post_purchase_hybrid";
      const webhookType = isBackNumber
        ? (stripeAmount === 0 ? "back_number_purchase" : "back_number_purchase_hybrid")
        : (stripeAmount === 0 ? "post_purchase" : "post_purchase_hybrid");

      // Generate idempotency key
      const idemKey = getOrGenerateIdempotencyKey(
        input.idempotencyKey,
        stripeAmount === 0 ? pointsOperationType : hybridOperationType,
        ctx.user.id,
        input.postId
      );

      // If all points cover the price, just do points purchase
      if (stripeAmount === 0) {
        const auditLogId = await createAuditLog({
          operationType: pointsOperationType,
          userId: ctx.user.id,
          creatorId: post.creatorId,
          totalAmount: purchasePrice,
          pointsAmount: purchasePrice,
          idempotencyKey: idemKey,
        });

        try {
          // Create purchase record
          const [purchase] = await db.insert(purchases).values({
            userId: ctx.user.id,
            postId: input.postId,
            amount: purchasePrice,
            paymentMethod: "points",
            pointsUsed: purchasePrice,
            stripeAmount: 0,
            idempotencyKey: idemKey,
          }).returning();

          // Deduct points
          const newBalance = await deductPoints(
            db,
            ctx.user.id,
            purchasePrice,
            purchase.id,
            `${purchaseLabel}: ${post.title || `Post #${post.id}`}`
          );

          // Update creator's total support
          await db.update(creators)
            .set({ totalSupport: sql`${creators.totalSupport} + ${purchasePrice}` })
            .where(eq(creators.id, post.creatorId));

          await completeAuditLog(auditLogId, {
            referenceType: "purchase",
            referenceId: purchase.id,
          });

          return { success: true, purchaseId: purchase.id, newBalance, requiresStripe: false };
        } catch (error) {
          await failAuditLog(auditLogId, {
            code: error instanceof TRPCError ? error.code : "UNKNOWN",
            message: error instanceof Error ? error.message : "Unknown error",
          }, false);
          throw error;
        }
      }

      // Create audit log for hybrid purchase
      const auditLogId = await createAuditLog({
        operationType: hybridOperationType,
        userId: ctx.user.id,
        creatorId: post.creatorId,
        totalAmount: purchasePrice,
        pointsAmount: input.pointsToUse,
        stripeAmount: stripeAmount,
        idempotencyKey: idemKey,
      });

      try {
        const stripe = getStripe();

        // Create checkout session for remaining amount
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "jpy",
                product_data: {
                  name: post.title || `Post #${post.id}`,
                  description: `${purchaseLabel}（${input.pointsToUse}pt割引適用）`,
                },
                unit_amount: stripeAmount,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: ctx.user.id.toString(),
            postId: post.id.toString(),
            creatorId: post.creatorId.toString(),
            type: webhookType,
            totalAmount: purchasePrice.toString(),
            pointsUsed: input.pointsToUse.toString(),
            stripeAmount: stripeAmount.toString(),
            auditLogId: auditLogId.toString(),
            idempotencyKey: idemKey,
          },
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
        });

        return { sessionId: session.id, url: session.url, requiresStripe: true };
      } catch (error) {
        await failAuditLog(auditLogId, {
          code: "STRIPE_ERROR",
          message: error instanceof Error ? error.message : "Stripe error",
        }, false);
        throw error;
      }
    }),
});
