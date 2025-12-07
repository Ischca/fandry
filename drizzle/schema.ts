import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const postTypeEnum = pgEnum("post_type", ["free", "paid", "membership"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "expired"]);
export const pointTransactionTypeEnum = pgEnum("point_transaction_type", [
  "purchase",      // ポイント購入
  "refund",        // 返金
  "post_purchase", // 有料投稿購入
  "subscription",  // サブスク支払い
  "tip",           // チップ
  "admin_grant",   // 管理者付与
]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Creators table - クリエイター情報
 */
export const creators = pgTable("creators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 64 }).notNull().unique(),
  displayName: varchar("display_name", { length: 128 }).notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  category: varchar("category", { length: 64 }),
  socialLinks: text("social_links"), // JSON string
  // Creator identity
  creatorTitle: varchar("creator_title", { length: 64 }), // 肩書き: "イラストレーター", "VTuber"
  skillTags: text("skill_tags"), // JSON: ["Photoshop", "Live2D", "ファンタジー"]
  creatorStatus: varchar("creator_status", { length: 32 }), // "available" | "busy" | "closed" | "custom"
  statusMessage: varchar("status_message", { length: 100 }), // カスタムステータスメッセージ
  // Profile customization (litlink-like)
  profileLinks: text("profile_links"), // JSON: [{id, title, url, icon?, color?}]
  accentColor: varchar("accent_color", { length: 16 }), // Hex color e.g. "#E05A3A"
  headerStyle: varchar("header_style", { length: 16 }).default("compact"), // "compact" | "full" | "minimal"
  showStats: integer("show_stats").default(1).notNull(), // 統計を表示するか
  showPosts: integer("show_posts").default(1).notNull(), // 投稿セクションを表示するか
  featuredPostIds: text("featured_post_ids"), // JSON: [postId, postId, ...]
  isAdult: integer("is_adult").default(0).notNull(), // アダルトクリエイター
  totalSupport: integer("total_support").default(0).notNull(), // 累計支援額（円）
  followerCount: integer("follower_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = typeof creators.$inferInsert;

/**
 * Posts table - 投稿
 */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 256 }),
  content: text("content").notNull(),
  type: postTypeEnum("type").default("free").notNull(),
  price: integer("price").default(0), // 価格（円）
  membershipTier: integer("membership_tier").default(0), // 必要な会員ランク
  mediaUrls: text("media_urls"), // JSON array of URLs
  isAdult: integer("is_adult").default(0).notNull(), // アダルトコンテンツ
  isPinned: integer("is_pinned").default(0).notNull(), // boolean as int
  likeCount: integer("like_count").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Subscription plans table - 月額支援プラン
 */
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // 月額料金（円）
  tier: integer("tier").notNull(), // ランク（1, 2, 3...）
  benefits: text("benefits"), // JSON array of benefits
  isAdult: integer("is_adult").default(0).notNull(), // アダルトプラン
  isActive: integer("is_active").default(1).notNull(),
  subscriberCount: integer("subscriber_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

/**
 * Subscriptions table - ユーザーの月額支援
 */
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: integer("plan_id").notNull().references(() => subscriptionPlans.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  paymentMethod: varchar("payment_method", { length: 16 }), // "points" | "stripe"
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 128 }),
  lastPointDeductAt: timestamp("last_point_deduct_at"),
  pointDeductFailedAt: timestamp("point_deduct_failed_at"), // 猶予期間開始
  startedAt: timestamp("started_at").defaultNow().notNull(),
  nextBillingAt: timestamp("next_billing_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Tips table - 投げ銭
 */
export const tips = pgTable("tips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // 金額（円）
  message: text("message"),
  isRecurring: integer("is_recurring").default(0).notNull(), // 定期投げ銭かどうか
  paymentMethod: varchar("payment_method", { length: 16 }), // "points" | "stripe" | "hybrid"
  pointsUsed: integer("points_used").default(0),
  stripeAmount: integer("stripe_amount").default(0),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;

/**
 * Purchases table - 有料投稿の購入履歴
 */
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paymentMethod: varchar("payment_method", { length: 16 }), // "points" | "stripe" | "hybrid"
  pointsUsed: integer("points_used").default(0),
  stripeAmount: integer("stripe_amount").default(0),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

/**
 * Follows table - フォロー関係
 */
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  notificationEnabled: integer("notification_enabled").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

/**
 * Comments table - コメント
 */
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Likes table - いいね
 */
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Media table - アップロードされたメディアファイル
 */
export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 512 }).notNull().unique(), // R2 object key
  url: text("url").notNull(),
  type: varchar("type", { length: 32 }).notNull(), // image/video
  mimeType: varchar("mime_type", { length: 128 }).notNull(),
  size: integer("size").notNull(), // bytes
  width: integer("width"),
  height: integer("height"),
  duration: integer("duration"), // video duration in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Media = typeof media.$inferSelect;
export type InsertMedia = typeof media.$inferInsert;

/**
 * Reports table - 通報
 */
export const reportTypeEnum = pgEnum("report_type", [
  "spam",
  "harassment",
  "inappropriate_content",
  "copyright",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: varchar("target_type", { length: 32 }).notNull(), // "post" | "creator" | "comment"
  targetId: integer("target_id").notNull(),
  type: reportTypeEnum("type").notNull(),
  reason: text("reason"),
  status: reportStatusEnum("status").default("pending").notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Blocks table - ブロック
 */
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedId: integer("blocked_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = typeof blocks.$inferInsert;

/**
 * User Points table - ユーザーのポイント残高
 */
export const userPoints = pgTable("user_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  balance: integer("balance").default(0).notNull(),
  totalPurchased: integer("total_purchased").default(0).notNull(), // 累計購入ポイント
  totalSpent: integer("total_spent").default(0).notNull(), // 累計消費ポイント
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserPoint = typeof userPoints.$inferSelect;
export type InsertUserPoint = typeof userPoints.$inferInsert;

/**
 * Point Transactions table - ポイント取引履歴
 */
export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: pointTransactionTypeEnum("type").notNull(),
  amount: integer("amount").notNull(), // 正:獲得, 負:消費
  balanceAfter: integer("balance_after").notNull(),
  referenceId: integer("reference_id"), // 関連するtip/purchase/subscription ID
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;

/**
 * Point Packages table - ポイント購入パッケージ
 */
export const pointPackages = pgTable("point_packages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  points: integer("points").notNull(),
  priceJpy: integer("price_jpy").notNull(), // 1pt = 1円
  stripePriceId: varchar("stripe_price_id", { length: 128 }),
  isActive: integer("is_active").default(1).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PointPackage = typeof pointPackages.$inferSelect;
export type InsertPointPackage = typeof pointPackages.$inferInsert;
