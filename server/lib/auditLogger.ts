/**
 * 監査ログヘルパー
 * 全ての金融取引を一元的に記録し、復旧可能にする
 */
import { eq } from "drizzle-orm";
import { getDb, assertDb } from "../routers/_shared";
import { paymentAuditLogs } from "../../drizzle/schema";
import type { InsertPaymentAuditLog } from "../../drizzle/schema";

export type AuditOperationType =
  | "point_purchase"
  | "point_refund"
  | "post_purchase_points"
  | "post_purchase_stripe"
  | "post_purchase_hybrid"
  | "subscription_points"
  | "subscription_stripe"
  | "subscription_renewal"
  | "subscription_cancel"
  | "tip_points"
  | "tip_stripe"
  | "tip_hybrid"
  | "admin_point_grant"
  | "admin_refund";

export type AuditStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export interface CreateAuditLogParams {
  operationType: AuditOperationType;
  userId?: number;
  creatorId?: number;
  totalAmount: number;
  pointsAmount?: number;
  stripeAmount?: number;
  idempotencyKey?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
}

export interface CompleteAuditLogParams {
  referenceType?: "purchase" | "tip" | "subscription" | "point_transaction";
  referenceId?: number;
  stripePaymentIntentId?: string;
  stripeSubscriptionId?: string;
}

export interface FailAuditLogParams {
  code?: string;
  message: string;
  details?: unknown;
}

/**
 * 監査ログを作成（処理開始時に呼び出す）
 */
export async function createAuditLog(
  params: CreateAuditLogParams
): Promise<number> {
  const db = await getDb();
  assertDb(db);

  const insertData: InsertPaymentAuditLog = {
    operationType: params.operationType,
    status: "pending",
    userId: params.userId,
    creatorId: params.creatorId,
    totalAmount: params.totalAmount,
    pointsAmount: params.pointsAmount ?? 0,
    stripeAmount: params.stripeAmount ?? 0,
    idempotencyKey: params.idempotencyKey,
    stripeSessionId: params.stripeSessionId,
    stripePaymentIntentId: params.stripePaymentIntentId,
    stripeSubscriptionId: params.stripeSubscriptionId,
  };

  const [result] = await db
    .insert(paymentAuditLogs)
    .values(insertData)
    .returning({ id: paymentAuditLogs.id });

  return result.id;
}

/**
 * 監査ログを処理中に更新
 */
export async function updateAuditLogProcessing(
  auditLogId: number
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(paymentAuditLogs)
    .set({
      status: "processing",
      updatedAt: new Date(),
    })
    .where(eq(paymentAuditLogs.id, auditLogId));
}

/**
 * 監査ログを完了に更新（成功時に呼び出す）
 */
export async function completeAuditLog(
  auditLogId: number,
  params: CompleteAuditLogParams
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(paymentAuditLogs)
    .set({
      status: "completed",
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      stripePaymentIntentId: params.stripePaymentIntentId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(paymentAuditLogs.id, auditLogId));
}

/**
 * 監査ログを失敗に更新（失敗時に呼び出す）
 * @param requiresRecovery - 手動復旧が必要かどうか（ポイント引き落とし後のStripe失敗など）
 */
export async function failAuditLog(
  auditLogId: number,
  error: FailAuditLogParams,
  requiresRecovery: boolean = false
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(paymentAuditLogs)
    .set({
      status: "failed",
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details ? JSON.stringify(error.details) : null,
      requiresRecovery: requiresRecovery ? 1 : 0,
      updatedAt: new Date(),
    })
    .where(eq(paymentAuditLogs.id, auditLogId));
}

/**
 * 監査ログを返金済みに更新
 */
export async function refundAuditLog(
  auditLogId: number,
  adminNote?: string
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(paymentAuditLogs)
    .set({
      status: "refunded",
      adminNote,
      updatedAt: new Date(),
    })
    .where(eq(paymentAuditLogs.id, auditLogId));
}

/**
 * 手動復旧が必要な取引としてマーク
 */
export async function markForRecovery(
  auditLogId: number,
  note?: string
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(paymentAuditLogs)
    .set({
      requiresRecovery: 1,
      recoveryNote: note,
      updatedAt: new Date(),
    })
    .where(eq(paymentAuditLogs.id, auditLogId));
}

/**
 * 復旧完了をマーク
 */
export async function markRecovered(
  auditLogId: number,
  adminId: number,
  note?: string
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(paymentAuditLogs)
    .set({
      requiresRecovery: 0,
      recoveredAt: new Date(),
      recoveryNote: note,
      processedBy: adminId,
      processedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(paymentAuditLogs.id, auditLogId));
}

/**
 * 復旧試行回数をインクリメント
 */
export async function incrementRecoveryAttempts(
  auditLogId: number
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  const [log] = await db
    .select({ attempts: paymentAuditLogs.recoveryAttempts })
    .from(paymentAuditLogs)
    .where(eq(paymentAuditLogs.id, auditLogId));

  if (log) {
    await db
      .update(paymentAuditLogs)
      .set({
        recoveryAttempts: log.attempts + 1,
        updatedAt: new Date(),
      })
      .where(eq(paymentAuditLogs.id, auditLogId));
  }
}

/**
 * 監査ログを取得
 */
export async function getAuditLog(auditLogId: number) {
  const db = await getDb();
  assertDb(db);

  const [log] = await db
    .select()
    .from(paymentAuditLogs)
    .where(eq(paymentAuditLogs.id, auditLogId));

  return log;
}

/**
 * idempotencyKeyで監査ログを検索
 */
export async function findAuditLogByIdempotencyKey(idempotencyKey: string) {
  const db = await getDb();
  assertDb(db);

  const [log] = await db
    .select()
    .from(paymentAuditLogs)
    .where(eq(paymentAuditLogs.idempotencyKey, idempotencyKey));

  return log;
}
