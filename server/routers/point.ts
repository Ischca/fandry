import {
  publicProcedure,
  protectedProcedure,
  router,
  TRPCError,
  z,
  eq,
  sql,
  getDb,
  userPoints,
  pointTransactions,
  pointPackages,
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

export const pointRouter = router({
  // Get current user's point balance
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { balance: 0, totalPurchased: 0, totalSpent: 0 };

    const [points] = await db.select()
      .from(userPoints)
      .where(eq(userPoints.userId, ctx.user.id))
      .limit(1);

    if (!points) {
      return { balance: 0, totalPurchased: 0, totalSpent: 0 };
    }

    return {
      balance: points.balance,
      totalPurchased: points.totalPurchased,
      totalSpent: points.totalSpent,
    };
  }),

  // Get transaction history
  getTransactions: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(pointTransactions)
        .where(eq(pointTransactions.userId, ctx.user.id))
        .orderBy(sql`${pointTransactions.createdAt} DESC`)
        .limit(input.limit || 20)
        .offset(input.offset || 0);
    }),

  // Get available point packages
  getPackages: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db.select()
      .from(pointPackages)
      .where(eq(pointPackages.isActive, 1))
      .orderBy(sql`${pointPackages.displayOrder} ASC`);
  }),

  // Create Stripe checkout session for point purchase
  createCheckoutSession: protectedProcedure
    .input(z.object({
      packageId: z.number(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      idempotencyKey: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get the package
      const [pkg] = await db.select()
        .from(pointPackages)
        .where(eq(pointPackages.id, input.packageId))
        .limit(1);

      if (!pkg || !pkg.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      }

      // Generate idempotency key
      const idemKey = getOrGenerateIdempotencyKey(
        input.idempotencyKey,
        "point_purchase",
        ctx.user.id,
        input.packageId
      );

      // Create audit log (pending state - will be completed by webhook)
      const auditLogId = await createAuditLog({
        operationType: "point_purchase",
        userId: ctx.user.id,
        totalAmount: pkg.priceJpy,
        stripeAmount: pkg.priceJpy,
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
                  name: pkg.name,
                  description: `${pkg.points}ポイント`,
                },
                unit_amount: pkg.priceJpy,
              },
              quantity: 1,
            },
          ],
          metadata: {
            userId: ctx.user.id.toString(),
            packageId: pkg.id.toString(),
            points: pkg.points.toString(),
            type: "point_purchase",
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

  // Credit points to user (called after successful payment via webhook or manually for testing)
  creditPoints: protectedProcedure
    .input(z.object({
      amount: z.number().min(1),
      description: z.string().optional(),
      stripePaymentIntentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get or create user points record
      let [points] = await db.select()
        .from(userPoints)
        .where(eq(userPoints.userId, ctx.user.id))
        .limit(1);

      if (!points) {
        // Create new record
        const [inserted] = await db.insert(userPoints).values({
          userId: ctx.user.id,
          balance: 0,
          totalPurchased: 0,
          totalSpent: 0,
        }).returning();
        points = inserted;
      }

      const newBalance = points.balance + input.amount;

      // Update balance
      await db.update(userPoints)
        .set({
          balance: newBalance,
          totalPurchased: points.totalPurchased + input.amount,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, ctx.user.id));

      // Record transaction
      await db.insert(pointTransactions).values({
        userId: ctx.user.id,
        type: "purchase",
        amount: input.amount,
        balanceAfter: newBalance,
        description: input.description || `${input.amount}ポイント購入`,
        stripePaymentIntentId: input.stripePaymentIntentId,
      });

      return { success: true, newBalance };
    }),

  // Deduct points from user (internal use)
  deductPoints: protectedProcedure
    .input(z.object({
      amount: z.number().min(1),
      type: z.enum(["post_purchase", "subscription", "tip"]),
      referenceId: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Get user points
      const [points] = await db.select()
        .from(userPoints)
        .where(eq(userPoints.userId, ctx.user.id))
        .limit(1);

      if (!points || points.balance < input.amount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient point balance" });
      }

      const newBalance = points.balance - input.amount;

      // Update balance
      await db.update(userPoints)
        .set({
          balance: newBalance,
          totalSpent: points.totalSpent + input.amount,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, ctx.user.id));

      // Record transaction
      await db.insert(pointTransactions).values({
        userId: ctx.user.id,
        type: input.type,
        amount: -input.amount,
        balanceAfter: newBalance,
        referenceId: input.referenceId,
        description: input.description,
      });

      return { success: true, newBalance };
    }),
});
