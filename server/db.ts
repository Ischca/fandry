import { eq, and, or, desc, sql, ilike, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  InsertUser, users,
  creators, InsertCreator,
  posts, InsertPost,
  subscriptionPlans,
  subscriptions,
  purchases,
  tips, InsertTip,
  follows,
  comments, InsertComment,
  likes
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = neon(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Creator queries
export async function getCreatorByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creators).where(eq(creators.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCreatorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(creators).where(eq(creators.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCreator(creator: InsertCreator) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(creators).values(creator).returning({ id: creators.id });
  return result[0];
}

export async function updateCreator(id: number, updates: Partial<InsertCreator>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(creators).set(updates).where(eq(creators.id, id));
}

// Post queries
export async function getPostsByCreatorId(creatorId: number, limit = 20, includeScheduled = false) {
  const db = await getDb();
  if (!db) return [];

  // Include scheduled posts only if explicitly requested (for creator's own view)
  const conditions = includeScheduled
    ? eq(posts.creatorId, creatorId)
    : and(eq(posts.creatorId, creatorId), isNotNull(posts.publishedAt));

  return db.select().from(posts).where(conditions).orderBy(desc(posts.createdAt)).limit(limit);
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get post with access check
export async function getPostWithAccess(postId: number, userId?: number) {
  const db = await getDb();
  if (!db) return null;

  // Get post with creator info
  const result = await db
    .select({
      id: posts.id,
      creatorId: posts.creatorId,
      title: posts.title,
      content: posts.content,
      previewContent: posts.previewContent,
      type: posts.type,
      price: posts.price,
      membershipTier: posts.membershipTier,
      mediaUrls: posts.mediaUrls,
      previewMediaUrls: posts.previewMediaUrls,
      scheduledAt: posts.scheduledAt,
      publishedAt: posts.publishedAt,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      viewCount: posts.viewCount,
      createdAt: posts.createdAt,
      creatorUsername: creators.username,
      creatorDisplayName: creators.displayName,
      creatorAvatarUrl: creators.avatarUrl,
      creatorUserId: creators.userId,
    })
    .from(posts)
    .leftJoin(creators, eq(posts.creatorId, creators.id))
    .where(eq(posts.id, postId))
    .limit(1);

  if (result.length === 0) return null;

  const post = result[0];

  // Check if post is published or user is the creator
  const isCreator = userId && post.creatorUserId === userId;
  const isPublished = !!post.publishedAt;
  const isScheduled = !!post.scheduledAt && !post.publishedAt;

  // Unpublished posts are only visible to the creator
  if (!isPublished && !isCreator) {
    return null;
  }

  // Check access rights
  let hasAccess = false;
  let isPurchased = false;
  let isSubscribed = false;

  // Creator always has full access
  if (isCreator) {
    hasAccess = true;
  } else if (post.type === 'free') {
    hasAccess = true;
  } else if (userId) {
    if (post.type === 'paid') {
      // Check if user has purchased this post
      const purchase = await db
        .select()
        .from(purchases)
        .where(and(eq(purchases.userId, userId), eq(purchases.postId, postId)))
        .limit(1);
      isPurchased = purchase.length > 0;
      hasAccess = isPurchased;
    } else if (post.type === 'membership') {
      // Check if user has active subscription with sufficient tier
      const subscription = await db
        .select({
          tier: subscriptionPlans.tier,
        })
        .from(subscriptions)
        .leftJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
        .where(
          and(
            eq(subscriptions.userId, userId),
            eq(subscriptionPlans.creatorId, post.creatorId),
            eq(subscriptions.status, 'active')
          )
        )
        .limit(1);

      if (subscription.length > 0) {
        const userTier = subscription[0].tier ?? 0;
        const requiredTier = post.membershipTier ?? 0;
        // User's subscription tier must be >= required tier for the post
        isSubscribed = true;
        hasAccess = userTier >= requiredTier;
      }
    }
  }

  // For posts without access, return preview content instead of full content
  const returnContent = hasAccess ? post.content : (post.previewContent || null);
  const returnMediaUrls = hasAccess ? post.mediaUrls : (post.previewMediaUrls || null);
  const hasPreview = !hasAccess && (!!post.previewContent || !!post.previewMediaUrls);

  return {
    id: post.id,
    creatorId: post.creatorId,
    title: post.title,
    content: returnContent,
    type: post.type,
    price: post.price,
    membershipTier: post.membershipTier,
    mediaUrls: returnMediaUrls,
    scheduledAt: post.scheduledAt,
    publishedAt: post.publishedAt,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    creatorUsername: post.creatorUsername,
    creatorDisplayName: post.creatorDisplayName,
    creatorAvatarUrl: post.creatorAvatarUrl,
    hasAccess,
    isPurchased,
    isSubscribed,
    isScheduled,
    isCreator,
    hasPreview,
  };
}

export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values(post).returning({ id: posts.id });
  return { id: result[0].id, ...post };
}

// Subscription plan queries
export async function getSubscriptionPlansByCreatorId(creatorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.creatorId, creatorId));
}

// Tip queries
export async function createTip(tip: InsertTip) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tips).values(tip).returning({ id: tips.id });
  return result[0];
}

export async function getTipsByCreatorId(creatorId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tips).where(eq(tips.creatorId, creatorId)).orderBy(desc(tips.createdAt)).limit(limit);
}

// Follow queries
export async function followCreator(userId: number, creatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(follows).values({ userId, creatorId });
  await db.update(creators).set({ followerCount: sql`${creators.followerCount} + 1` }).where(eq(creators.id, creatorId));
}

export async function unfollowCreator(userId: number, creatorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(follows).where(and(eq(follows.userId, userId), eq(follows.creatorId, creatorId)));
  await db.update(creators).set({ followerCount: sql`${creators.followerCount} - 1` }).where(eq(creators.id, creatorId));
}

export async function isFollowing(userId: number, creatorId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(follows).where(and(eq(follows.userId, userId), eq(follows.creatorId, creatorId))).limit(1);
  return result.length > 0;
}

// Comment queries
export async function getCommentsByPostId(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      postId: comments.postId,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userDisplayName: users.name,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
  return result;
}

export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(comment).returning({ id: comments.id });
  await db.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, comment.postId));
  return result[0];
}

// Like queries
export async function likePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(likes).values({ userId, postId });
  await db.update(posts).set({ likeCount: sql`${posts.likeCount} + 1` }).where(eq(posts.id, postId));
}

export async function unlikePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
  await db.update(posts).set({ likeCount: sql`${posts.likeCount} - 1` }).where(eq(posts.id, postId));
}

export async function hasLiked(userId: number, postId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.postId, postId))).limit(1);
  return result.length > 0;
}

// Feed queries
export async function getFollowingPosts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get posts from creators that the user follows
  const result = await db
    .select({
      id: posts.id,
      creatorId: posts.creatorId,
      title: posts.title,
      content: posts.content,
      type: posts.type,
      price: posts.price,
      mediaUrls: posts.mediaUrls,
      likeCount: posts.likeCount,
      commentCount: posts.commentCount,
      createdAt: posts.createdAt,
      creator: {
        id: creators.id,
        username: creators.username,
        displayName: creators.displayName,
        avatarUrl: creators.avatarUrl,
      },
    })
    .from(posts)
    .innerJoin(follows, eq(follows.creatorId, posts.creatorId))
    .innerJoin(creators, eq(creators.id, posts.creatorId))
    .where(eq(follows.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(50);

  return result;
}

export async function getAllCreators(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(creators)
    .orderBy(desc(creators.followerCount))
    .limit(limit);

  return result;
}

export async function searchCreators(query: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(creators)
    .where(
      or(
        ilike(creators.username, `%${query}%`),
        ilike(creators.displayName, `%${query}%`)
      )
    )
    .limit(limit);

  return result;
}

export async function getCreatorsByCategory(category: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(creators)
    .where(eq(creators.category, category))
    .orderBy(desc(creators.followerCount))
    .limit(limit);

  return result;
}

// Get all followers of a creator (for notifications)
export async function getFollowersByCreatorId(creatorId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      userId: follows.userId,
    })
    .from(follows)
    .where(eq(follows.creatorId, creatorId));

  return result.map(r => r.userId);
}
