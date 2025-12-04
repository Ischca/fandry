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

  // Get purchase options for a post
  getPurchaseOptions: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post with creator info
      const [post] = await db.select({
        id: posts.id,
        price: posts.price,
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

      if (post.price === null || post.price === 0) {
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
          price: post.price,
          creatorUsername: post.creatorUsername,
          creatorDisplayName: post.creatorDisplayName,
        },
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
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post
      const [post] = await db.select({
        id: posts.id,
        price: posts.price,
        isAdult: posts.isAdult,
        creatorId: posts.creatorId,
        title: posts.title,
      })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      assertFound(post, "Post not found");

      if (post.price === null || post.price === 0) {
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
        throw new TRPCError({ code: "CONFLICT", message: "Already purchased" });
      }

      // Create purchase record
      const [purchase] = await db.insert(purchases).values({
        userId: ctx.user.id,
        postId: input.postId,
        amount: post.price,
        paymentMethod: "points",
        pointsUsed: post.price,
        stripeAmount: 0,
      }).returning();

      // Deduct points
      const newBalance = await deductPoints(
        db,
        ctx.user.id,
        post.price,
        purchase.id,
        `投稿購入: ${post.title || `Post #${post.id}`}`
      );

      // Update creator's total support
      await db.update(creators)
        .set({ totalSupport: sql`${creators.totalSupport} + ${post.price}` })
        .where(eq(creators.id, post.creatorId));

      return { success: true, purchaseId: purchase.id, newBalance };
    }),

  // Create Stripe checkout for non-adult content direct purchase
  createStripeCheckout: protectedProcedure
    .input(z.object({
      postId: z.number(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post with creator info
      const [post] = await db.select({
        id: posts.id,
        price: posts.price,
        isAdult: posts.isAdult,
        creatorId: posts.creatorId,
        title: posts.title,
      })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      assertFound(post, "Post not found");

      if (post.price === null || post.price === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This post is free" });
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
                description: "コンテンツ購入",
              },
              unit_amount: post.price,
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: ctx.user.id.toString(),
          postId: post.id.toString(),
          creatorId: post.creatorId.toString(),
          type: "post_purchase",
          amount: post.price.toString(),
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });

      return { sessionId: session.id, url: session.url };
    }),

  // Create hybrid payment (points + Stripe for remaining)
  createHybridCheckout: protectedProcedure
    .input(z.object({
      postId: z.number(),
      pointsToUse: z.number().min(0),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get post
      const [post] = await db.select({
        id: posts.id,
        price: posts.price,
        isAdult: posts.isAdult,
        creatorId: posts.creatorId,
        title: posts.title,
      })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      assertFound(post, "Post not found");

      if (post.price === null || post.price === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This post is free" });
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

      if (input.pointsToUse > post.price) {
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

      const stripeAmount = post.price - input.pointsToUse;

      // If all points cover the price, just do points purchase
      if (stripeAmount === 0) {
        // Create purchase record
        const [purchase] = await db.insert(purchases).values({
          userId: ctx.user.id,
          postId: input.postId,
          amount: post.price,
          paymentMethod: "points",
          pointsUsed: post.price,
          stripeAmount: 0,
        }).returning();

        // Deduct points
        const newBalance = await deductPoints(
          db,
          ctx.user.id,
          post.price,
          purchase.id,
          `投稿購入: ${post.title || `Post #${post.id}`}`
        );

        // Update creator's total support
        await db.update(creators)
          .set({ totalSupport: sql`${creators.totalSupport} + ${post.price}` })
          .where(eq(creators.id, post.creatorId));

        return { success: true, purchaseId: purchase.id, newBalance, requiresStripe: false };
      }

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
                description: `コンテンツ購入（${input.pointsToUse}pt割引適用）`,
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
          type: "post_purchase_hybrid",
          totalAmount: post.price.toString(),
          pointsUsed: input.pointsToUse.toString(),
          stripeAmount: stripeAmount.toString(),
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });

      return { sessionId: session.id, url: session.url, requiresStripe: true };
    }),
});
