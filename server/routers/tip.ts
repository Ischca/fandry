import {
  publicProcedure,
  protectedProcedure,
  router,
  TRPCError,
  z,
  eq,
  sql,
  getDb,
  creators,
  tips,
  userPoints,
  pointTransactions,
  assertDb,
  assertFound,
  createAuditLog,
  completeAuditLog,
  failAuditLog,
  getOrGenerateIdempotencyKey,
} from "./_shared";
import { getTipsByCreatorId } from "../db";
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
  let [points] = await db.select().from(userPoints).where(eq(userPoints.userId, userId)).limit(1);

  if (!points) {
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

  await db.update(userPoints)
    .set({
      balance: newBalance,
      totalSpent: points.totalSpent + amount,
      updatedAt: new Date(),
    })
    .where(eq(userPoints.userId, userId));

  await db.insert(pointTransactions).values({
    userId,
    type: "tip",
    amount: -amount,
    balanceAfter: newBalance,
    referenceId,
    description,
  });

  return newBalance;
}

export const tipRouter = router({
  // Get tip options for a creator
  getTipOptions: protectedProcedure
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select()
        .from(creators)
        .where(eq(creators.id, input.creatorId))
        .limit(1);

      assertFound(creator, "Creator not found");

      const isAdult = creator.isAdult === 1;
      const userBalance = await getUserBalance(db, ctx.user.id);

      return {
        creator: {
          id: creator.id,
          username: creator.username,
          displayName: creator.displayName,
          avatarUrl: creator.avatarUrl,
        },
        isAdult,
        userBalance,
        paymentMethods: isAdult
          ? ["points"]
          : ["points", "stripe", "hybrid"],
        presetAmounts: [100, 500, 1000, 3000, 5000, 10000],
      };
    }),

  // Send tip with points
  sendWithPoints: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      amount: z.number().min(100).max(1_000_000_000),
      message: z.string().max(500).optional(),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      // Get creator
      const [creator] = await db.select()
        .from(creators)
        .where(eq(creators.id, input.creatorId))
        .limit(1);

      assertFound(creator, "Creator not found");

      // Check balance
      const balance = await getUserBalance(db, ctx.user.id);
      if (balance < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ポイント残高が不足しています" });
      }

      // Generate idempotency key
      const idemKey = getOrGenerateIdempotencyKey(
        input.idempotencyKey,
        "tip_points",
        ctx.user.id,
        input.creatorId,
        input.amount
      );

      // Create audit log
      const auditLogId = await createAuditLog({
        operationType: "tip_points",
        userId: ctx.user.id,
        creatorId: input.creatorId,
        totalAmount: input.amount,
        pointsAmount: input.amount,
        idempotencyKey: idemKey,
      });

      try {
        // Create tip record
        const [tip] = await db.insert(tips).values({
          userId: ctx.user.id,
          creatorId: input.creatorId,
          amount: input.amount,
          message: input.message,
          isRecurring: 0,
          paymentMethod: "points",
          pointsUsed: input.amount,
          stripeAmount: 0,
          idempotencyKey: idemKey,
        }).returning();

        // Deduct points
        const newBalance = await deductPoints(
          db,
          ctx.user.id,
          input.amount,
          tip.id,
          `チップ: ${creator.displayName}`
        );

        // Update creator's total support
        await db.update(creators)
          .set({ totalSupport: sql`${creators.totalSupport} + ${input.amount}` })
          .where(eq(creators.id, input.creatorId));

        // Complete audit log
        await completeAuditLog(auditLogId, {
          referenceType: "tip",
          referenceId: tip.id,
        });

        return { success: true, tipId: tip.id, newBalance };
      } catch (error) {
        await failAuditLog(auditLogId, {
          code: error instanceof TRPCError ? error.code : "UNKNOWN",
          message: error instanceof Error ? error.message : "Unknown error",
        }, false);
        throw error;
      }
    }),

  // Create Stripe checkout for tip
  createStripeCheckout: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      amount: z.number().min(100).max(1_000_000_000),
      message: z.string().max(500).optional(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select()
        .from(creators)
        .where(eq(creators.id, input.creatorId))
        .limit(1);

      assertFound(creator, "Creator not found");

      // Check if adult creator
      if (creator.isAdult === 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "アダルトクリエイターへのチップはポイントでのみ送れます"
        });
      }

      // Generate idempotency key
      const idemKey = getOrGenerateIdempotencyKey(
        input.idempotencyKey,
        "tip_stripe",
        ctx.user.id,
        input.creatorId,
        input.amount
      );

      // Create audit log (pending state - will be completed by webhook)
      const auditLogId = await createAuditLog({
        operationType: "tip_stripe",
        userId: ctx.user.id,
        creatorId: input.creatorId,
        totalAmount: input.amount,
        stripeAmount: input.amount,
        idempotencyKey: idemKey,
      });

      try {
        const stripe = getStripe();

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "jpy",
                product_data: {
                  name: `${creator.displayName}へのチップ`,
                  description: input.message || "応援ありがとうございます！",
                },
                unit_amount: input.amount,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: ctx.user.id.toString(),
            creatorId: input.creatorId.toString(),
            amount: input.amount.toString(),
            message: input.message || "",
            type: "tip",
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

  // Create hybrid tip (points + Stripe)
  createHybridCheckout: protectedProcedure
    .input(z.object({
      creatorId: z.number(),
      amount: z.number().min(100).max(1_000_000_000),
      pointsToUse: z.number().min(0).max(1_000_000_000),
      message: z.string().max(500).optional(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db.select()
        .from(creators)
        .where(eq(creators.id, input.creatorId))
        .limit(1);

      assertFound(creator, "Creator not found");

      // Check if adult creator
      if (creator.isAdult === 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "アダルトクリエイターへのチップはポイントでのみ送れます"
        });
      }

      // Check user balance
      const userBalance = await getUserBalance(db, ctx.user.id);
      if (input.pointsToUse > userBalance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ポイント残高が不足しています" });
      }

      if (input.pointsToUse > input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "使用ポイントが金額を超えています" });
      }

      const stripeAmount = input.amount - input.pointsToUse;

      // Generate idempotency key
      const idemKey = getOrGenerateIdempotencyKey(
        input.idempotencyKey,
        stripeAmount === 0 ? "tip_points" : "tip_hybrid",
        ctx.user.id,
        input.creatorId,
        input.amount
      );

      // If all points cover the amount, just do points tip
      if (stripeAmount === 0) {
        const auditLogId = await createAuditLog({
          operationType: "tip_points",
          userId: ctx.user.id,
          creatorId: input.creatorId,
          totalAmount: input.amount,
          pointsAmount: input.amount,
          idempotencyKey: idemKey,
        });

        try {
          const [tip] = await db.insert(tips).values({
            userId: ctx.user.id,
            creatorId: input.creatorId,
            amount: input.amount,
            message: input.message,
            isRecurring: 0,
            paymentMethod: "points",
            pointsUsed: input.amount,
            stripeAmount: 0,
            idempotencyKey: idemKey,
          }).returning();

          const newBalance = await deductPoints(
            db,
            ctx.user.id,
            input.amount,
            tip.id,
            `チップ: ${creator.displayName}`
          );

          await db.update(creators)
            .set({ totalSupport: sql`${creators.totalSupport} + ${input.amount}` })
            .where(eq(creators.id, input.creatorId));

          await completeAuditLog(auditLogId, {
            referenceType: "tip",
            referenceId: tip.id,
          });

          return { success: true, tipId: tip.id, newBalance, requiresStripe: false };
        } catch (error) {
          await failAuditLog(auditLogId, {
            code: error instanceof TRPCError ? error.code : "UNKNOWN",
            message: error instanceof Error ? error.message : "Unknown error",
          }, false);
          throw error;
        }
      }

      // Create audit log for hybrid tip
      const auditLogId = await createAuditLog({
        operationType: "tip_hybrid",
        userId: ctx.user.id,
        creatorId: input.creatorId,
        totalAmount: input.amount,
        pointsAmount: input.pointsToUse,
        stripeAmount: stripeAmount,
        idempotencyKey: idemKey,
      });

      try {
        const stripe = getStripe();

        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "jpy",
                product_data: {
                  name: `${creator.displayName}へのチップ`,
                  description: input.message
                    ? `${input.message}（${input.pointsToUse}pt割引適用）`
                    : `応援ありがとう！（${input.pointsToUse}pt割引適用）`,
                },
                unit_amount: stripeAmount,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: ctx.user.id.toString(),
            creatorId: input.creatorId.toString(),
            totalAmount: input.amount.toString(),
            pointsUsed: input.pointsToUse.toString(),
            stripeAmount: stripeAmount.toString(),
            message: input.message || "",
            type: "tip_hybrid",
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

  getByCreatorId: publicProcedure
    .input(z.object({ creatorId: z.number(), limit: z.number().optional() }))
    .query(async ({ input }) => {
      return getTipsByCreatorId(input.creatorId, input.limit);
    }),

  getMyTips: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const [creator] = await db.select().from(creators).where(eq(creators.userId, ctx.user.id)).limit(1);
      if (!creator) return [];

      return db.select({
        id: tips.id,
        amount: tips.amount,
        message: tips.message,
        paymentMethod: tips.paymentMethod,
        pointsUsed: tips.pointsUsed,
        stripeAmount: tips.stripeAmount,
        createdAt: tips.createdAt,
      })
        .from(tips)
        .where(eq(tips.creatorId, creator.id))
        .orderBy(sql`${tips.createdAt} DESC`)
        .limit(input.limit || 50);
    }),
});
