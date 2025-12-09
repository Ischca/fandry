// Subscription router - handles user subscriptions to creator plans
import {
  protectedProcedure,
  router,
  TRPCError,
  z,
  eq,
  and,
  sql,
  getDb,
  creators,
  subscriptionPlans,
  subscriptions,
  userPoints,
  pointTransactions,
  assertDb,
  assertFound,
} from "./_shared";
import { getCreatorById } from "../db";
import { createNotification } from "./notification";
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

// Helper: Check if plan is adult content
async function isAdultPlan(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, plan: { creatorId: number; isAdult: number }): Promise<boolean> {
  // Check plan-level flag
  if (plan.isAdult === 1) return true;

  // Check creator-level flag
  const [creator] = await db.select().from(creators).where(eq(creators.id, plan.creatorId)).limit(1);
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
    type: "subscription",
    amount: -amount,
    balanceAfter: newBalance,
    referenceId,
    description,
  });

  return newBalance;
}

export const subscriptionRouter = router({
  // Get user's active subscriptions
  getMySubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select({
      id: subscriptions.id,
      planId: subscriptions.planId,
      status: subscriptions.status,
      paymentMethod: subscriptions.paymentMethod,
      startedAt: subscriptions.startedAt,
      nextBillingAt: subscriptions.nextBillingAt,
      planName: subscriptionPlans.name,
      planPrice: subscriptionPlans.price,
      planTier: subscriptionPlans.tier,
      creatorId: subscriptionPlans.creatorId,
      creatorUsername: creators.username,
      creatorDisplayName: creators.displayName,
      creatorAvatarUrl: creators.avatarUrl,
    })
      .from(subscriptions)
      .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
      .leftJoin(creators, eq(subscriptionPlans.creatorId, creators.id))
      .where(eq(subscriptions.userId, ctx.user.id))
      .orderBy(sql`${subscriptions.createdAt} DESC`);
  }),

  // Check subscription status for a specific creator
  checkSubscription: protectedProcedure
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { subscribed: false, subscription: null };

      const [subscription] = await db.select({
        id: subscriptions.id,
        planId: subscriptions.planId,
        status: subscriptions.status,
        planTier: subscriptionPlans.tier,
        planName: subscriptionPlans.name,
        planPrice: subscriptionPlans.price,
        nextBillingAt: subscriptions.nextBillingAt,
      })
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptionPlans.creatorId, input.creatorId),
          eq(subscriptions.status, "active")
        ))
        .limit(1);

      return {
        subscribed: !!subscription,
        subscription,
      };
    }),

  // Get subscription options for a plan
  getSubscriptionOptions: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [plan] = await db.select({
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        price: subscriptionPlans.price,
        tier: subscriptionPlans.tier,
        isAdult: subscriptionPlans.isAdult,
        creatorId: subscriptionPlans.creatorId,
        creatorUsername: creators.username,
        creatorDisplayName: creators.displayName,
        creatorIsAdult: creators.isAdult,
      })
        .from(subscriptionPlans)
        .leftJoin(creators, eq(subscriptionPlans.creatorId, creators.id))
        .where(eq(subscriptionPlans.id, input.planId))
        .limit(1);

      assertFound(plan, "Plan not found");

      // Check existing subscription
      const [existingSub] = await db.select()
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptionPlans.creatorId, plan.creatorId),
          eq(subscriptions.status, "active")
        ))
        .limit(1);

      if (existingSub) {
        return { alreadySubscribed: true, plan };
      }

      const isAdult = plan.isAdult === 1 || plan.creatorIsAdult === 1;
      const isFree = plan.price === 0;
      const userBalance = await getUserBalance(db, ctx.user.id);

      // Free plans only need "free" as payment method
      let paymentMethods: string[];
      if (isFree) {
        paymentMethods = ["free"];
      } else if (isAdult) {
        paymentMethods = ["points"];
      } else {
        paymentMethods = ["points", "stripe"];
      }

      return {
        alreadySubscribed: false,
        plan: {
          id: plan.id,
          name: plan.name,
          price: plan.price,
          tier: plan.tier,
          creatorUsername: plan.creatorUsername,
          creatorDisplayName: plan.creatorDisplayName,
        },
        isAdult,
        isFree,
        userBalance,
        paymentMethods,
      };
    }),

  // Subscribe with points (for adult content or by choice) - also handles free plans
  subscribeWithPoints: protectedProcedure
    .input(z.object({ planId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [plan] = await db.select({
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        price: subscriptionPlans.price,
        tier: subscriptionPlans.tier,
        isAdult: subscriptionPlans.isAdult,
        creatorId: subscriptionPlans.creatorId,
      })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.planId))
        .limit(1);

      assertFound(plan, "Plan not found");

      // Check existing subscription
      const [existingSub] = await db.select()
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptionPlans.creatorId, plan.creatorId),
          eq(subscriptions.status, "active")
        ))
        .limit(1);

      if (existingSub) {
        throw new TRPCError({ code: "CONFLICT", message: "Already subscribed to this creator" });
      }

      const isFreeplan = plan.price === 0;
      let newBalance = 0;

      if (!isFreeplan) {
        // Check balance for paid plans
        const balance = await getUserBalance(db, ctx.user.id);
        if (balance < plan.price) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "ポイント残高が不足しています" });
        }
      }

      // Create subscription
      const nextBillingAt = new Date();
      nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

      const [subscription] = await db.insert(subscriptions).values({
        userId: ctx.user.id,
        planId: input.planId,
        status: "active",
        paymentMethod: isFreeplan ? "free" : "points",
        startedAt: new Date(),
        nextBillingAt: isFreeplan ? null : nextBillingAt, // Free plans don't need billing
        lastPointDeductAt: isFreeplan ? null : new Date(),
      }).returning();

      if (!isFreeplan) {
        // Deduct first month's points (only for paid plans)
        newBalance = await deductPoints(
          db,
          ctx.user.id,
          plan.price,
          subscription.id,
          `月額サブスク: ${plan.name}`
        );

        // Update creator's total support
        await db.update(creators)
          .set({ totalSupport: sql`${creators.totalSupport} + ${plan.price}` })
          .where(eq(creators.id, plan.creatorId));
      }

      // Update plan subscriber count
      await db.update(subscriptionPlans)
        .set({ subscriberCount: sql`${subscriptionPlans.subscriberCount} + 1` })
        .where(eq(subscriptionPlans.id, input.planId));

      // Send notification to creator
      const creator = await getCreatorById(plan.creatorId);
      if (creator && creator.userId !== ctx.user.id) {
        await createNotification({
          userId: creator.userId,
          type: "subscription",
          title: isFreeplan ? "新しい無料会員" : "新しいサブスクライバー",
          message: `「${plan.name}」プランに登録しました`,
          actorId: ctx.user.id,
          targetType: "subscription",
          targetId: subscription.id,
          link: `/dashboard`,
        });
      }

      return { success: true, subscriptionId: subscription.id, newBalance, isFreeplan };
    }),

  // Create Stripe subscription for non-adult plans
  createStripeSubscription: protectedProcedure
    .input(z.object({
      planId: z.number(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [plan] = await db.select({
        id: subscriptionPlans.id,
        name: subscriptionPlans.name,
        price: subscriptionPlans.price,
        isAdult: subscriptionPlans.isAdult,
        creatorId: subscriptionPlans.creatorId,
      })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, input.planId))
        .limit(1);

      assertFound(plan, "Plan not found");

      // Check if adult plan
      const isAdult = await isAdultPlan(db, plan);
      if (isAdult) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "アダルトプランはポイントでのみ購読可能です"
        });
      }

      // Check existing subscription
      const [existingSub] = await db.select()
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptionPlans.creatorId, plan.creatorId),
          eq(subscriptions.status, "active")
        ))
        .limit(1);

      if (existingSub) {
        throw new TRPCError({ code: "CONFLICT", message: "Already subscribed to this creator" });
      }

      const stripe = getStripe();

      // Create a Stripe checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "jpy",
              product_data: {
                name: plan.name,
                description: "月額サブスクリプション",
              },
              unit_amount: plan.price,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: ctx.user.id.toString(),
          planId: plan.id.toString(),
          creatorId: plan.creatorId.toString(),
          type: "subscription",
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });

      return { sessionId: session.id, url: session.url };
    }),

  // Cancel subscription
  cancel: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [subscription] = await db.select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.id, input.subscriptionId),
          eq(subscriptions.userId, ctx.user.id)
        ))
        .limit(1);

      assertFound(subscription, "Subscription not found");

      if (subscription.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This subscription is not active" });
      }

      // If Stripe subscription, cancel in Stripe
      if (subscription.paymentMethod === "stripe" && subscription.stripeSubscriptionId) {
        const stripe = getStripe();
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      // Update subscription status
      await db.update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, input.subscriptionId));

      // Update plan subscriber count
      await db.update(subscriptionPlans)
        .set({ subscriberCount: sql`${subscriptionPlans.subscriberCount} - 1` })
        .where(eq(subscriptionPlans.id, subscription.planId));

      return { success: true };
    }),
});
