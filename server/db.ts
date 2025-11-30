import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  creators, InsertCreator,
  posts, InsertPost,
  subscriptionPlans,
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
      _db = drizzle(process.env.DATABASE_URL);
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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
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
  const result = await db.insert(creators).values(creator);
  return result;
}

export async function updateCreator(id: number, updates: Partial<InsertCreator>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(creators).set(updates).where(eq(creators.id, id));
}

// Post queries
export async function getPostsByCreatorId(creatorId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).where(eq(posts.creatorId, creatorId)).orderBy(desc(posts.createdAt)).limit(limit);
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(posts).values(post);
  return result;
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
  const result = await db.insert(tips).values(tip);
  return result;
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
  return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
}

export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(comment);
  await db.update(posts).set({ commentCount: sql`${posts.commentCount} + 1` }).where(eq(posts.id, comment.postId));
  return result;
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
