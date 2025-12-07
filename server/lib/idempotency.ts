/**
 * 冪等性ヘルパー
 * 重複取引を防止するためのユーティリティ
 */
import { eq, lt, and } from "drizzle-orm";
import { getDb, assertDb } from "../routers/_shared";
import { idempotencyKeys } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const EXPIRY_HOURS = 24;

export type IdempotencyStatus = "pending" | "completed" | "failed";

export interface IdempotencyResult<T> {
  isNewRequest: boolean;
  cachedResult?: T;
  keyId: number;
}

/**
 * 冪等性キーをチェックし、既存の結果があれば返す
 * 新規リクエストの場合はpending状態のキーを作成
 */
export async function checkIdempotencyKey<T>(
  key: string,
  operationType: string,
  userId?: number
): Promise<IdempotencyResult<T>> {
  const db = await getDb();
  assertDb(db);

  // 既存のキーを検索
  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(eq(idempotencyKeys.key, key));

  if (existing) {
    // キーが期限切れの場合は削除して新規扱い
    if (new Date(existing.expiresAt) < new Date()) {
      await db.delete(idempotencyKeys).where(eq(idempotencyKeys.id, existing.id));
    } else {
      // まだ処理中の場合
      if (existing.status === "pending") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "この操作は既に処理中です。しばらくお待ちください。",
        });
      }

      // 完了している場合はキャッシュされた結果を返す
      if (existing.status === "completed" && existing.resultData) {
        return {
          isNewRequest: false,
          cachedResult: JSON.parse(existing.resultData) as T,
          keyId: existing.id,
        };
      }

      // 失敗している場合は再試行を許可（新規リクエスト扱い）
      if (existing.status === "failed") {
        await db
          .update(idempotencyKeys)
          .set({
            status: "pending",
            resultData: null,
            updatedAt: new Date(),
          })
          .where(eq(idempotencyKeys.id, existing.id));
        return { isNewRequest: true, keyId: existing.id };
      }
    }
  }

  // 新規キーを作成
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EXPIRY_HOURS);

  const [result] = await db
    .insert(idempotencyKeys)
    .values({
      key,
      operationType,
      userId,
      status: "pending",
      expiresAt,
    })
    .returning({ id: idempotencyKeys.id });

  return { isNewRequest: true, keyId: result.id };
}

/**
 * 冪等性キーを完了状態に更新（結果をキャッシュ）
 */
export async function completeIdempotencyKey<T>(
  keyId: number,
  result: T
): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(idempotencyKeys)
    .set({
      status: "completed",
      resultData: JSON.stringify(result),
      updatedAt: new Date(),
    })
    .where(eq(idempotencyKeys.id, keyId));
}

/**
 * 冪等性キーを失敗状態に更新
 */
export async function failIdempotencyKey(keyId: number): Promise<void> {
  const db = await getDb();
  assertDb(db);

  await db
    .update(idempotencyKeys)
    .set({
      status: "failed",
      updatedAt: new Date(),
    })
    .where(eq(idempotencyKeys.id, keyId));
}

/**
 * 冪等性をラップするヘルパー関数
 * 既存の完了結果があればそれを返し、なければ処理を実行
 */
export async function withIdempotency<T>(
  key: string,
  operationType: string,
  userId: number | undefined,
  fn: () => Promise<T>
): Promise<T> {
  const check = await checkIdempotencyKey<T>(key, operationType, userId);

  if (!check.isNewRequest && check.cachedResult !== undefined) {
    return check.cachedResult;
  }

  try {
    const result = await fn();
    await completeIdempotencyKey(check.keyId, result);
    return result;
  } catch (error) {
    await failIdempotencyKey(check.keyId);
    throw error;
  }
}

/**
 * 期限切れの冪等性キーを削除（cronジョブ用）
 */
export async function cleanupExpiredKeys(): Promise<number> {
  const db = await getDb();
  assertDb(db);

  const result = await db
    .delete(idempotencyKeys)
    .where(lt(idempotencyKeys.expiresAt, new Date()))
    .returning({ id: idempotencyKeys.id });

  return result.length;
}

/**
 * 冪等性キーを生成するヘルパー
 */
export function generateIdempotencyKey(
  operationType: string,
  userId: number,
  ...identifiers: (string | number)[]
): string {
  const timestamp = Math.floor(Date.now() / 1000); // 秒単位
  const parts = [operationType, userId, ...identifiers, timestamp];
  return parts.join("_");
}

/**
 * リクエストから冪等性キーを取得または生成
 */
export function getOrGenerateIdempotencyKey(
  providedKey: string | undefined,
  operationType: string,
  userId: number,
  ...identifiers: (string | number)[]
): string {
  if (providedKey) {
    return providedKey;
  }
  return generateIdempotencyKey(operationType, userId, ...identifiers);
}
