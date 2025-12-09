/**
 * Cron job for publishing scheduled posts
 *
 * This script should be run frequently (e.g., every 1-5 minutes via Railway cron or external scheduler)
 * to publish posts that are scheduled for publication.
 *
 * Run with: npx tsx server/cron/publishScheduledPosts.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, lte, isNull, isNotNull } from "drizzle-orm";
import {
  posts,
  creators,
  follows,
  notifications,
  users,
} from "../../drizzle/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  console.log(`[${new Date().toISOString()}] Starting scheduled post publication...`);

  const now = new Date();

  // Find all posts that are scheduled and due for publication
  const scheduledPosts = await db
    .select({
      id: posts.id,
      creatorId: posts.creatorId,
      title: posts.title,
      content: posts.content,
      scheduledAt: posts.scheduledAt,
      creatorUsername: creators.username,
      creatorUserId: creators.userId,
    })
    .from(posts)
    .leftJoin(creators, eq(posts.creatorId, creators.id))
    .where(
      and(
        isNotNull(posts.scheduledAt),
        lte(posts.scheduledAt, now),
        isNull(posts.publishedAt) // Not yet published
      )
    );

  console.log(`Found ${scheduledPosts.length} posts to publish`);

  for (const post of scheduledPosts) {
    try {
      // Publish the post
      await db
        .update(posts)
        .set({
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(posts.id, post.id));

      console.log(`Published post ${post.id}: "${post.title || post.content.slice(0, 30)}..."`);

      // Get all followers of this creator
      const followerIds = await db
        .select({ userId: follows.userId })
        .from(follows)
        .where(eq(follows.creatorId, post.creatorId));

      // Send notifications to all followers
      if (followerIds.length > 0 && post.creatorUserId) {
        const notificationValues = followerIds.map(f => ({
          userId: f.userId,
          type: "new_post" as const,
          title: "新しい投稿",
          message: post.title || post.content.slice(0, 50),
          actorId: post.creatorUserId,
          targetType: "post",
          targetId: post.id,
          link: `/@${post.creatorUsername}/posts/${post.id}`,
        }));

        await db.insert(notifications).values(notificationValues);
        console.log(`Sent ${followerIds.length} notifications for post ${post.id}`);
      }
    } catch (error) {
      console.error(`Failed to publish post ${post.id}:`, error);
    }
  }

  console.log(`[${new Date().toISOString()}] Scheduled post publication complete`);
}

main().catch(console.error);
