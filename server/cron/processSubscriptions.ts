/**
 * Cron job for processing monthly point-based subscription renewals
 *
 * This script should be run daily (e.g., via Railway cron or external scheduler)
 * to process subscriptions that are due for renewal.
 *
 * Run with: npx tsx server/cron/processSubscriptions.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, lte, sql } from "drizzle-orm";
import {
  subscriptions,
  subscriptionPlans,
  userPoints,
  pointTransactions,
  creators,
} from "../../drizzle/schema";

const GRACE_PERIOD_DAYS = 7;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  console.log(`[${new Date().toISOString()}] Starting subscription renewal process...`);

  // Find all active point-based subscriptions that are due for renewal
  const now = new Date();
  const dueSubscriptions = await db
    .select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      planId: subscriptions.planId,
      nextBillingAt: subscriptions.nextBillingAt,
      pointDeductFailedAt: subscriptions.pointDeductFailedAt,
      planName: subscriptionPlans.name,
      planPrice: subscriptionPlans.price,
      creatorId: subscriptionPlans.creatorId,
    })
    .from(subscriptions)
    .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.status, "active"),
        eq(subscriptions.paymentMethod, "points"),
        lte(subscriptions.nextBillingAt, now)
      )
    );

  console.log(`Found ${dueSubscriptions.length} subscriptions due for renewal`);

  let renewed = 0;
  let failed = 0;
  let gracePeriod = 0;
  let cancelled = 0;

  for (const sub of dueSubscriptions) {
    if (!sub.planPrice || !sub.creatorId) {
      console.log(`Subscription ${sub.id}: Invalid plan data, skipping`);
      continue;
    }

    try {
      // Get user's current balance
      const [userPoint] = await db
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, sub.userId))
        .limit(1);

      const balance = userPoint?.balance ?? 0;

      if (balance >= sub.planPrice) {
        // Sufficient balance - renew subscription
        const newBalance = balance - sub.planPrice;
        const nextBillingAt = new Date(sub.nextBillingAt!);
        nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

        // Deduct points
        await db
          .update(userPoints)
          .set({
            balance: newBalance,
            totalSpent: sql`${userPoints.totalSpent} + ${sub.planPrice}`,
            updatedAt: new Date(),
          })
          .where(eq(userPoints.userId, sub.userId));

        // Record transaction
        await db.insert(pointTransactions).values({
          userId: sub.userId,
          type: "subscription",
          amount: -sub.planPrice,
          balanceAfter: newBalance,
          referenceId: sub.id,
          description: `月額サブスク自動更新: ${sub.planName}`,
        });

        // Update subscription
        await db
          .update(subscriptions)
          .set({
            nextBillingAt,
            lastPointDeductAt: new Date(),
            pointDeductFailedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));

        // Update creator's total support
        await db
          .update(creators)
          .set({ totalSupport: sql`${creators.totalSupport} + ${sub.planPrice}` })
          .where(eq(creators.id, sub.creatorId));

        console.log(`Subscription ${sub.id}: Renewed successfully (user ${sub.userId})`);
        renewed++;
      } else {
        // Insufficient balance - check grace period
        if (sub.pointDeductFailedAt) {
          // Already in grace period - calculate end date
          const graceEndDate = new Date(sub.pointDeductFailedAt);
          graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);

          if (graceEndDate <= now) {
            // Grace period expired - cancel subscription
            await db
              .update(subscriptions)
              .set({
                status: "cancelled",
                cancelledAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, sub.id));

            // Update subscriber count
            await db
              .update(subscriptionPlans)
              .set({ subscriberCount: sql`${subscriptionPlans.subscriberCount} - 1` })
              .where(eq(subscriptionPlans.id, sub.planId));

            console.log(
              `Subscription ${sub.id}: Cancelled due to insufficient balance after grace period`
            );
            cancelled++;
          } else {
            console.log(
              `Subscription ${sub.id}: Still in grace period until ${graceEndDate.toISOString()}`
            );
            gracePeriod++;
          }
        } else {
          // Start grace period
          await db
            .update(subscriptions)
            .set({
              pointDeductFailedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.id, sub.id));

          const graceEndDate = new Date();
          graceEndDate.setDate(graceEndDate.getDate() + GRACE_PERIOD_DAYS);

          console.log(
            `Subscription ${sub.id}: Insufficient balance (${balance}/${sub.planPrice}), grace period started until ${graceEndDate.toISOString()}`
          );
          gracePeriod++;
        }
        failed++;
      }
    } catch (error) {
      console.error(`Subscription ${sub.id}: Error processing -`, error);
      failed++;
    }
  }

  console.log(`
[${new Date().toISOString()}] Subscription renewal complete:
  - Renewed: ${renewed}
  - Failed (insufficient balance): ${failed}
  - In grace period: ${gracePeriod}
  - Cancelled: ${cancelled}
  `);

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
