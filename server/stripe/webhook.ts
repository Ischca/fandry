import { Router, raw } from "express";
import Stripe from "stripe";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import {
  userPoints,
  pointTransactions,
  purchases,
  creators,
  posts,
  subscriptions,
  subscriptionPlans,
  tips,
  paymentAuditLogs,
} from "../../drizzle/schema";
import {
  completeAuditLog,
  failAuditLog,
  markForRecovery,
} from "../lib/auditLogger";
import { createNotification } from "../routers/notification";
import { logger, createPaymentLogger } from "../lib/logger";

const router = Router();

// Stripe client
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

// Database client
async function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const sql = neon(databaseUrl);
  return drizzle(sql);
}

// Credit points to user
async function creditPoints(
  userId: number,
  amount: number,
  stripePaymentIntentId?: string,
  description?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get or create user points record
    let [points] = await db.select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    if (!points) {
      const [inserted] = await db.insert(userPoints).values({
        userId,
        balance: 0,
        totalPurchased: 0,
        totalSpent: 0,
      }).returning();
      points = inserted;
    }

    const newBalance = points.balance + amount;

    // Update balance
    await db.update(userPoints)
      .set({
        balance: newBalance,
        totalPurchased: points.totalPurchased + amount,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));

    // Record transaction
    await db.insert(pointTransactions).values({
      userId,
      type: "purchase",
      amount,
      balanceAfter: newBalance,
      description: description || `${amount}ポイント購入`,
      stripePaymentIntentId,
    });

    logger.info("Points credited successfully", {
      userId,
      amount,
      pointsAmount: newBalance,
      operationType: "point_purchase",
      stripePaymentIntentId,
    });
    return true;
  } catch (error) {
    logger.error("Failed to credit points", {
      userId,
      amount,
      operationType: "point_purchase",
      error,
    });
    return false;
  }
}

// Complete post purchase (Stripe direct)
async function completePostPurchase(
  userId: number,
  postId: number,
  amount: number,
  stripePaymentIntentId?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get post for creator ID
    const [post] = await db.select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      logger.error("Post not found for purchase", { postId, userId });
      return false;
    }

    // Create purchase record
    await db.insert(purchases).values({
      userId,
      postId,
      amount,
      paymentMethod: "stripe",
      pointsUsed: 0,
      stripeAmount: amount,
      stripePaymentIntentId,
    });

    // Update creator's total support
    await db.update(creators)
      .set({ totalSupport: sql`${creators.totalSupport} + ${amount}` })
      .where(eq(creators.id, post.creatorId));

    logger.info("Post purchase completed", {
      userId,
      postId,
      amount,
      creatorId: post.creatorId,
      operationType: "post_purchase_stripe",
      stripePaymentIntentId,
    });
    return true;
  } catch (error) {
    logger.error("Failed to complete post purchase", {
      userId,
      postId,
      amount,
      operationType: "post_purchase_stripe",
      error,
    });
    return false;
  }
}

// Complete hybrid post purchase (points + Stripe)
async function completeHybridPurchase(
  userId: number,
  postId: number,
  totalAmount: number,
  pointsUsed: number,
  stripeAmount: number,
  stripePaymentIntentId?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get post for creator ID
    const [post] = await db.select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) {
      logger.error("Post not found for hybrid purchase", { postId, userId });
      return false;
    }

    // Get user points
    const [points] = await db.select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    if (!points || points.balance < pointsUsed) {
      logger.error("Insufficient points for hybrid purchase", {
        userId,
        postId,
        pointsUsed,
        currentBalance: points?.balance ?? 0,
      });
      return false;
    }

    // Deduct points
    const newBalance = points.balance - pointsUsed;
    await db.update(userPoints)
      .set({
        balance: newBalance,
        totalSpent: points.totalSpent + pointsUsed,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));

    // Create purchase record
    const [purchase] = await db.insert(purchases).values({
      userId,
      postId,
      amount: totalAmount,
      paymentMethod: "hybrid",
      pointsUsed,
      stripeAmount,
      stripePaymentIntentId,
    }).returning();

    // Record point transaction
    await db.insert(pointTransactions).values({
      userId,
      type: "post_purchase",
      amount: -pointsUsed,
      balanceAfter: newBalance,
      referenceId: purchase.id,
      description: `投稿購入（ハイブリッド）: Post #${postId}`,
    });

    // Update creator's total support
    await db.update(creators)
      .set({ totalSupport: sql`${creators.totalSupport} + ${totalAmount}` })
      .where(eq(creators.id, post.creatorId));

    logger.info("Hybrid purchase completed", {
      userId,
      postId,
      amount: totalAmount,
      pointsAmount: pointsUsed,
      stripeAmount,
      creatorId: post.creatorId,
      operationType: "post_purchase_hybrid",
      stripePaymentIntentId,
    });
    return true;
  } catch (error) {
    logger.error("Failed to complete hybrid purchase", {
      userId,
      postId,
      amount: totalAmount,
      pointsAmount: pointsUsed,
      stripeAmount,
      operationType: "post_purchase_hybrid",
      error,
    });
    return false;
  }
}

// Complete Stripe subscription
async function completeStripeSubscription(
  userId: number,
  planId: number,
  stripeSubscriptionId: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get plan for creator ID
    const [plan] = await db.select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan) {
      logger.error("Plan not found for subscription", { planId, userId });
      return false;
    }

    // Get creator info
    const [creator] = await db.select()
      .from(creators)
      .where(eq(creators.id, plan.creatorId))
      .limit(1);

    // Calculate next billing date (1 month from now)
    const nextBillingAt = new Date();
    nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

    // Create subscription record
    const [subscription] = await db.insert(subscriptions).values({
      userId,
      planId,
      status: "active",
      paymentMethod: "stripe",
      stripeSubscriptionId,
      startedAt: new Date(),
      nextBillingAt,
    }).returning();

    // Update plan subscriber count
    await db.update(subscriptionPlans)
      .set({ subscriberCount: sql`${subscriptionPlans.subscriberCount} + 1` })
      .where(eq(subscriptionPlans.id, planId));

    // Update creator's total support
    await db.update(creators)
      .set({ totalSupport: sql`${creators.totalSupport} + ${plan.price}` })
      .where(eq(creators.id, plan.creatorId));

    // Send notification to creator
    if (creator && creator.userId !== userId) {
      await createNotification({
        userId: creator.userId,
        type: "subscription",
        title: "新しいサブスクライバー",
        message: `「${plan.name}」プランに登録しました`,
        actorId: userId,
        targetType: "subscription",
        targetId: subscription.id,
        link: `/dashboard`,
      });
    }

    logger.info("Stripe subscription completed", {
      userId,
      planId,
      creatorId: plan.creatorId,
      amount: plan.price,
      operationType: "subscription_stripe",
      stripeSubscriptionId,
    });
    return true;
  } catch (error) {
    logger.error("Failed to complete Stripe subscription", {
      userId,
      planId,
      operationType: "subscription_stripe",
      stripeSubscriptionId,
      error,
    });
    return false;
  }
}

// Complete Stripe tip
async function completeTip(
  userId: number,
  creatorId: number,
  amount: number,
  message: string,
  stripePaymentIntentId?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Create tip record
    await db.insert(tips).values({
      userId,
      creatorId,
      amount,
      message: message || null,
      isRecurring: 0,
      paymentMethod: "stripe",
      pointsUsed: 0,
      stripeAmount: amount,
      stripePaymentIntentId,
    });

    // Update creator's total support
    await db.update(creators)
      .set({ totalSupport: sql`${creators.totalSupport} + ${amount}` })
      .where(eq(creators.id, creatorId));

    logger.info("Tip completed", {
      userId,
      creatorId,
      amount,
      operationType: "tip_stripe",
      stripePaymentIntentId,
    });
    return true;
  } catch (error) {
    logger.error("Failed to complete tip", {
      userId,
      creatorId,
      amount,
      operationType: "tip_stripe",
      error,
    });
    return false;
  }
}

// Complete hybrid tip (points + Stripe)
async function completeHybridTip(
  userId: number,
  creatorId: number,
  totalAmount: number,
  pointsUsed: number,
  stripeAmount: number,
  message: string,
  stripePaymentIntentId?: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Get user points
    const [points] = await db.select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    if (!points || points.balance < pointsUsed) {
      logger.error("Insufficient points for hybrid tip", {
        userId,
        creatorId,
        pointsUsed,
        currentBalance: points?.balance ?? 0,
      });
      return false;
    }

    // Deduct points
    const newBalance = points.balance - pointsUsed;
    await db.update(userPoints)
      .set({
        balance: newBalance,
        totalSpent: points.totalSpent + pointsUsed,
        updatedAt: new Date(),
      })
      .where(eq(userPoints.userId, userId));

    // Create tip record
    const [tip] = await db.insert(tips).values({
      userId,
      creatorId,
      amount: totalAmount,
      message: message || null,
      isRecurring: 0,
      paymentMethod: "hybrid",
      pointsUsed,
      stripeAmount,
      stripePaymentIntentId,
    }).returning();

    // Record point transaction
    await db.insert(pointTransactions).values({
      userId,
      type: "tip",
      amount: -pointsUsed,
      balanceAfter: newBalance,
      referenceId: tip.id,
      description: `チップ（ハイブリッド）`,
    });

    // Update creator's total support
    await db.update(creators)
      .set({ totalSupport: sql`${creators.totalSupport} + ${totalAmount}` })
      .where(eq(creators.id, creatorId));

    logger.info("Hybrid tip completed", {
      userId,
      creatorId,
      amount: totalAmount,
      pointsAmount: pointsUsed,
      stripeAmount,
      operationType: "tip_hybrid",
      stripePaymentIntentId,
    });
    return true;
  } catch (error) {
    logger.error("Failed to complete hybrid tip", {
      userId,
      creatorId,
      amount: totalAmount,
      pointsAmount: pointsUsed,
      stripeAmount,
      operationType: "tip_hybrid",
      error,
    });
    return false;
  }
}

// Webhook endpoint - use raw body parser
router.post(
  "/",
  raw({ type: "application/json" }),
  async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      logger.error("Stripe not configured");
      return res.status(500).send("Stripe not configured");
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("Webhook secret not configured");
      return res.status(500).send("Webhook secret not configured");
    }

    const sig = req.headers["stripe-signature"];
    if (!sig) {
      return res.status(400).send("Missing signature");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed", { error: err });
      // Don't expose internal error details in production
      const errorMessage = process.env.NODE_ENV === "production"
        ? "Webhook verification failed"
        : `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`;
      return res.status(400).send(errorMessage);
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

        const type = session.metadata?.type;

        // Handle point purchase
        if (type === "point_purchase") {
          const userId = parseInt(session.metadata?.userId || "0");
          const points = parseInt(session.metadata?.points || "0");
          const auditLogId = session.metadata?.auditLogId ? parseInt(session.metadata.auditLogId) : null;

          if (userId && points) {
            const success = await creditPoints(
              userId,
              points,
              paymentIntentId,
              `${points}ポイント購入`
            );
            if (success) {
              // Complete audit log
              if (auditLogId) {
                await completeAuditLog(auditLogId, {
                  referenceType: "point_transaction",
                  stripePaymentIntentId: paymentIntentId,
                });
              }
            } else {
              logger.error("Failed to credit points via webhook", {
                stripeSessionId: session.id,
                userId,
                pointsAmount: points,
                operationType: "point_purchase",
              });
              // Mark for recovery
              if (auditLogId) {
                await failAuditLog(auditLogId, {
                  code: "WEBHOOK_PROCESSING_FAILED",
                  message: "Failed to credit points after successful payment",
                }, true);
              }
            }
          }
        }

        // Handle direct post purchase (including back number)
        else if (type === "post_purchase" || type === "back_number_purchase") {
          const userId = parseInt(session.metadata?.userId || "0");
          const postId = parseInt(session.metadata?.postId || "0");
          const amount = parseInt(session.metadata?.amount || "0");
          const auditLogId = session.metadata?.auditLogId ? parseInt(session.metadata.auditLogId) : null;

          if (userId && postId && amount) {
            const success = await completePostPurchase(
              userId,
              postId,
              amount,
              paymentIntentId
            );
            if (success) {
              if (auditLogId) {
                await completeAuditLog(auditLogId, {
                  referenceType: "purchase",
                  stripePaymentIntentId: paymentIntentId,
                });
              }
            } else {
              logger.error("Failed to complete post purchase via webhook", {
                stripeSessionId: session.id,
                userId,
                postId,
                amount,
                operationType: type,
              });
              if (auditLogId) {
                await failAuditLog(auditLogId, {
                  code: "WEBHOOK_PROCESSING_FAILED",
                  message: `Failed to complete ${type} after successful payment`,
                }, true);
              }
            }
          }
        }

        // Handle hybrid post purchase (including back number hybrid)
        else if (type === "post_purchase_hybrid" || type === "back_number_purchase_hybrid") {
          const userId = parseInt(session.metadata?.userId || "0");
          const postId = parseInt(session.metadata?.postId || "0");
          const totalAmount = parseInt(session.metadata?.totalAmount || "0");
          const pointsUsed = parseInt(session.metadata?.pointsUsed || "0");
          const stripeAmount = parseInt(session.metadata?.stripeAmount || "0");
          const auditLogId = session.metadata?.auditLogId ? parseInt(session.metadata.auditLogId) : null;

          if (userId && postId && totalAmount) {
            const success = await completeHybridPurchase(
              userId,
              postId,
              totalAmount,
              pointsUsed,
              stripeAmount,
              paymentIntentId
            );
            if (success) {
              if (auditLogId) {
                await completeAuditLog(auditLogId, {
                  referenceType: "purchase",
                  stripePaymentIntentId: paymentIntentId,
                });
              }
            } else {
              logger.error("Failed to complete hybrid purchase via webhook", {
                stripeSessionId: session.id,
                userId,
                postId,
                amount: totalAmount,
                pointsAmount: pointsUsed,
                stripeAmount,
                operationType: type,
              });
              // This is critical - points may have been deducted but purchase not recorded
              if (auditLogId) {
                await failAuditLog(auditLogId, {
                  code: "WEBHOOK_PROCESSING_FAILED",
                  message: `Failed to complete ${type} - points may need recovery`,
                  details: { userId, postId, pointsUsed, stripeAmount },
                }, true);
              }
            }
          }
        }

        // Handle Stripe subscription
        else if (type === "subscription") {
          const userId = parseInt(session.metadata?.userId || "0");
          const planId = parseInt(session.metadata?.planId || "0");
          const subscriptionId = typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || "";

          if (userId && planId && subscriptionId) {
            const success = await completeStripeSubscription(
              userId,
              planId,
              subscriptionId
            );
            if (!success) {
              logger.error("Failed to complete subscription via webhook", {
                stripeSessionId: session.id,
                userId,
                planId,
                operationType: "subscription_stripe",
              });
            }
          }
        }

        // Handle Stripe tip
        else if (type === "tip") {
          const userId = parseInt(session.metadata?.userId || "0");
          const creatorId = parseInt(session.metadata?.creatorId || "0");
          const amount = parseInt(session.metadata?.amount || "0");
          const message = session.metadata?.message || "";
          const auditLogId = session.metadata?.auditLogId ? parseInt(session.metadata.auditLogId) : null;

          if (userId && creatorId && amount) {
            const success = await completeTip(
              userId,
              creatorId,
              amount,
              message,
              paymentIntentId
            );
            if (success) {
              if (auditLogId) {
                await completeAuditLog(auditLogId, {
                  referenceType: "tip",
                  stripePaymentIntentId: paymentIntentId,
                });
              }
            } else {
              logger.error("Failed to complete tip via webhook", {
                stripeSessionId: session.id,
                userId,
                creatorId,
                amount,
                operationType: "tip_stripe",
              });
              if (auditLogId) {
                await failAuditLog(auditLogId, {
                  code: "WEBHOOK_PROCESSING_FAILED",
                  message: "Failed to complete tip after successful payment",
                }, true);
              }
            }
          }
        }

        // Handle hybrid tip
        else if (type === "tip_hybrid") {
          const userId = parseInt(session.metadata?.userId || "0");
          const creatorId = parseInt(session.metadata?.creatorId || "0");
          const totalAmount = parseInt(session.metadata?.totalAmount || "0");
          const pointsUsed = parseInt(session.metadata?.pointsUsed || "0");
          const stripeAmount = parseInt(session.metadata?.stripeAmount || "0");
          const message = session.metadata?.message || "";
          const auditLogId = session.metadata?.auditLogId ? parseInt(session.metadata.auditLogId) : null;

          if (userId && creatorId && totalAmount) {
            const success = await completeHybridTip(
              userId,
              creatorId,
              totalAmount,
              pointsUsed,
              stripeAmount,
              message,
              paymentIntentId
            );
            if (success) {
              if (auditLogId) {
                await completeAuditLog(auditLogId, {
                  referenceType: "tip",
                  stripePaymentIntentId: paymentIntentId,
                });
              }
            } else {
              logger.error("Failed to complete hybrid tip via webhook", {
                stripeSessionId: session.id,
                userId,
                creatorId,
                amount: totalAmount,
                pointsAmount: pointsUsed,
                stripeAmount,
                operationType: "tip_hybrid",
              });
              if (auditLogId) {
                await failAuditLog(auditLogId, {
                  code: "WEBHOOK_PROCESSING_FAILED",
                  message: "Failed to complete hybrid tip - points may need recovery",
                  details: { userId, creatorId, pointsUsed, stripeAmount },
                }, true);
              }
            }
          }
        }

        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.debug("PaymentIntent succeeded", {
          stripePaymentIntentId: paymentIntent.id,
        });
        // Handle direct payment success if needed
        break;
      }

      default:
        logger.debug("Unhandled webhook event type", { eventType: event.type });
    }

    res.json({ received: true });
  }
);

export default router;
