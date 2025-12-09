import { bigint, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

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
 * Transaction Status enum - 取引ステータス
 */
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",     // 処理待ち
  "completed",   // 完了
  "failed",      // 失敗
  "refunded",    // 返金済み
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
  totalSupport: bigint("total_support", { mode: "number" }).default(0).notNull(), // 累計支援額（円）
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
  previewContent: text("preview_content"), // 未購入ユーザー向けプレビューコンテンツ
  type: postTypeEnum("type").default("free").notNull(),
  price: bigint("price", { mode: "number" }).default(0), // 価格（円）
  membershipTier: integer("membership_tier").default(0), // 必要な会員ランク
  backNumberPrice: bigint("back_number_price", { mode: "number" }), // バックナンバー価格（nullなら販売不可）
  mediaUrls: text("media_urls"), // JSON array of URLs
  previewMediaUrls: text("preview_media_urls"), // プレビュー用メディアURL（JSON array）
  isAdult: integer("is_adult").default(0).notNull(), // アダルトコンテンツ
  isPinned: integer("is_pinned").default(0).notNull(), // boolean as int
  scheduledAt: timestamp("scheduled_at"), // 予約投稿日時（null=即時公開）
  publishedAt: timestamp("published_at"), // 実際の公開日時（null=下書きまたは予約中）
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
  price: bigint("price", { mode: "number" }).notNull(), // 月額料金（円）
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
  // トレーサビリティ拡張
  idempotencyKey: varchar("idempotency_key", { length: 128 }),
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
  amount: bigint("amount", { mode: "number" }).notNull(), // 金額（円）
  message: text("message"),
  isRecurring: integer("is_recurring").default(0).notNull(), // 定期投げ銭かどうか
  paymentMethod: varchar("payment_method", { length: 16 }), // "points" | "stripe" | "hybrid"
  pointsUsed: bigint("points_used", { mode: "number" }).default(0),
  stripeAmount: bigint("stripe_amount", { mode: "number" }).default(0),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  // トレーサビリティ拡張
  status: transactionStatusEnum("status").default("completed"), // 既存データ互換のためdefault="completed"
  idempotencyKey: varchar("idempotency_key", { length: 128 }),
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
  amount: bigint("amount", { mode: "number" }).notNull(),
  paymentMethod: varchar("payment_method", { length: 16 }), // "points" | "stripe" | "hybrid"
  pointsUsed: bigint("points_used", { mode: "number" }).default(0),
  stripeAmount: bigint("stripe_amount", { mode: "number" }).default(0),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  // トレーサビリティ拡張
  status: transactionStatusEnum("status").default("completed"), // 既存データ互換のためdefault="completed"
  idempotencyKey: varchar("idempotency_key", { length: 128 }),
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
  balance: bigint("balance", { mode: "number" }).default(0).notNull(),
  totalPurchased: bigint("total_purchased", { mode: "number" }).default(0).notNull(), // 累計購入ポイント
  totalSpent: bigint("total_spent", { mode: "number" }).default(0).notNull(), // 累計消費ポイント
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
  amount: bigint("amount", { mode: "number" }).notNull(), // 正:獲得, 負:消費
  balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
  referenceId: integer("reference_id"), // 関連するtip/purchase/subscription ID
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 128 }),
  description: text("description"),
  // トレーサビリティ拡張
  status: transactionStatusEnum("status").default("completed"), // 既存データ互換のためdefault="completed"
  idempotencyKey: varchar("idempotency_key", { length: 128 }),
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
  points: bigint("points", { mode: "number" }).notNull(),
  priceJpy: bigint("price_jpy", { mode: "number" }).notNull(), // 1pt = 1円
  stripePriceId: varchar("stripe_price_id", { length: 128 }),
  isActive: integer("is_active").default(1).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PointPackage = typeof pointPackages.$inferSelect;
export type InsertPointPackage = typeof pointPackages.$inferInsert;

/**
 * Withdrawal Status enum - 振込申請ステータス
 */
export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",    // 申請中
  "processing", // 処理中
  "completed",  // 完了
  "rejected",   // 却下
  "cancelled",  // キャンセル
]);

/**
 * Creator Balance table - クリエイターの売上残高
 */
export const creatorBalances = pgTable("creator_balances", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }).unique(),
  availableBalance: bigint("available_balance", { mode: "number" }).default(0).notNull(), // 振込可能額（円）
  pendingBalance: bigint("pending_balance", { mode: "number" }).default(0).notNull(), // 保留中（確定前）
  totalEarned: bigint("total_earned", { mode: "number" }).default(0).notNull(), // 累計売上
  totalWithdrawn: bigint("total_withdrawn", { mode: "number" }).default(0).notNull(), // 累計振込額
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CreatorBalance = typeof creatorBalances.$inferSelect;
export type InsertCreatorBalance = typeof creatorBalances.$inferInsert;

/**
 * Withdrawals table - 振込申請
 */
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  amount: bigint("amount", { mode: "number" }).notNull(), // 振込申請額（円）
  fee: bigint("fee", { mode: "number" }).default(0).notNull(), // 振込手数料
  netAmount: bigint("net_amount", { mode: "number" }).notNull(), // 実際の振込額（amount - fee）
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  // 銀行口座情報
  bankName: varchar("bank_name", { length: 64 }).notNull(),
  branchName: varchar("branch_name", { length: 64 }).notNull(),
  accountType: varchar("account_type", { length: 16 }).notNull(), // "普通" | "当座"
  accountNumber: varchar("account_number", { length: 16 }).notNull(),
  accountHolderName: varchar("account_holder_name", { length: 64 }).notNull(),
  // 処理情報
  processedAt: timestamp("processed_at"),
  processedBy: integer("processed_by").references(() => users.id),
  rejectionReason: text("rejection_reason"),
  note: text("note"), // 管理者メモ
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = typeof withdrawals.$inferInsert;

/**
 * Bank Accounts table - クリエイターの登録済み銀行口座
 */
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => creators.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 64 }).notNull(),
  bankCode: varchar("bank_code", { length: 8 }),
  branchName: varchar("branch_name", { length: 64 }).notNull(),
  branchCode: varchar("branch_code", { length: 8 }),
  accountType: varchar("account_type", { length: 16 }).notNull(), // "普通" | "当座"
  accountNumber: varchar("account_number", { length: 16 }).notNull(),
  accountHolderName: varchar("account_holder_name", { length: 64 }).notNull(),
  isDefault: integer("is_default").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;

/**
 * Notification Type enum - 通知タイプ
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "follow",       // 新しいフォロワー
  "like",         // いいね
  "comment",      // コメント
  "tip",          // チップ
  "subscription", // 新規サブスク
  "purchase",     // コンテンツ購入
  "new_post",     // フォロー中のクリエイターの新規投稿
  "system",       // システム通知
]);

/**
 * Audit Operation Type enum - 監査ログ操作タイプ
 */
export const auditOperationTypeEnum = pgEnum("audit_operation_type", [
  // ポイント関連
  "point_purchase",        // ポイント購入
  "point_refund",          // ポイント返金
  // コンテンツ購入関連
  "post_purchase_points",  // ポイントでの投稿購入
  "post_purchase_stripe",  // Stripeでの投稿購入
  "post_purchase_hybrid",  // ハイブリッド投稿購入
  // バックナンバー購入関連
  "back_number_purchase_points",  // ポイントでのバックナンバー購入
  "back_number_purchase_stripe",  // Stripeでのバックナンバー購入
  "back_number_purchase_hybrid",  // ハイブリッドバックナンバー購入
  // サブスクリプション関連
  "subscription_points",   // ポイントでのサブスク開始
  "subscription_stripe",   // Stripeでのサブスク開始
  "subscription_renewal",  // サブスク更新
  "subscription_cancel",   // サブスクキャンセル
  // チップ関連
  "tip_points",            // ポイントでのチップ
  "tip_stripe",            // Stripeでのチップ
  "tip_hybrid",            // ハイブリッドチップ
  // 管理者操作
  "admin_point_grant",     // 管理者によるポイント付与
  "admin_refund",          // 管理者による返金
]);

/**
 * Audit Status enum - 監査ログステータス
 */
export const auditStatusEnum = pgEnum("audit_status", [
  "pending",     // 処理開始
  "processing",  // 処理中
  "completed",   // 完了
  "failed",      // 失敗
  "refunded",    // 返金済み
  "cancelled",   // キャンセル
]);

/**
 * Notifications table - 通知
 */
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  message: text("message"),
  // 関連エンティティ
  actorId: integer("actor_id").references(() => users.id), // アクションを起こしたユーザー
  targetType: varchar("target_type", { length: 32 }), // "post" | "creator" | "comment" | null
  targetId: integer("target_id"), // 対象のID
  link: varchar("link", { length: 256 }), // 遷移先URL
  // ステータス
  isRead: integer("is_read").default(0).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Payment Audit Logs table - 課金監査ログ
 * 全ての金融取引を一元的に記録し、復旧可能にする
 */
export const paymentAuditLogs = pgTable("payment_audit_logs", {
  id: serial("id").primaryKey(),
  // 操作識別
  operationType: auditOperationTypeEnum("operation_type").notNull(),
  status: auditStatusEnum("status").default("pending").notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 128 }),
  // ユーザー情報
  userId: integer("user_id").references(() => users.id),
  creatorId: integer("creator_id").references(() => creators.id),
  // 金額情報
  totalAmount: bigint("total_amount", { mode: "number" }).notNull(), // 合計金額（円）
  pointsAmount: bigint("points_amount", { mode: "number" }).default(0).notNull(), // ポイント使用額
  stripeAmount: bigint("stripe_amount", { mode: "number" }).default(0).notNull(), // Stripe決済額
  // 参照情報
  referenceType: varchar("reference_type", { length: 32 }), // "purchase" | "tip" | "subscription" | "point_transaction"
  referenceId: integer("reference_id"), // 該当レコードのID
  // Stripe情報
  stripeSessionId: varchar("stripe_session_id", { length: 256 }),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 256 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 256 }),
  // エラー情報
  errorCode: varchar("error_code", { length: 64 }),
  errorMessage: text("error_message"),
  errorDetails: text("error_details"), // JSON形式の詳細エラー情報
  // 復旧情報
  requiresRecovery: integer("requires_recovery").default(0).notNull(), // 手動復旧が必要か
  recoveryAttempts: integer("recovery_attempts").default(0).notNull(),
  recoveredAt: timestamp("recovered_at"),
  recoveryNote: text("recovery_note"),
  // 管理者情報
  processedBy: integer("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  adminNote: text("admin_note"),
  // タイムスタンプ
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type PaymentAuditLog = typeof paymentAuditLogs.$inferSelect;
export type InsertPaymentAuditLog = typeof paymentAuditLogs.$inferInsert;

/**
 * Idempotency Keys table - 冪等性キー
 * 重複取引防止用
 */
export const idempotencyKeys = pgTable("idempotency_keys", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  operationType: varchar("operation_type", { length: 64 }).notNull(),
  userId: integer("user_id").references(() => users.id),
  status: varchar("status", { length: 16 }).default("pending").notNull(), // "pending" | "completed" | "failed"
  resultData: text("result_data"), // キャッシュされた結果（JSON）
  expiresAt: timestamp("expires_at").notNull(), // 24時間後に期限切れ
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type InsertIdempotencyKey = typeof idempotencyKeys.$inferInsert;
