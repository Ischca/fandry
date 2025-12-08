import {
  protectedProcedure,
  router,
  z,
  sql,
  eq,
  getDb,
  creators,
  assertDb,
  assertCreator,
  throwBadRequest,
} from "./_shared";
import {
  creatorBalances,
  withdrawals,
  bankAccounts,
} from "../../drizzle/schema";
import { encrypt, decrypt, maskAccountNumber, isEncrypted } from "../lib/crypto";

// 振込手数料（円）
const WITHDRAWAL_FEE = 300;
// 最低振込金額
const MIN_WITHDRAWAL_AMOUNT = 1000;

export const withdrawalRouter = router({
  // クリエイターの残高を取得
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    assertDb(db);

    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, ctx.user.id))
      .limit(1);
    assertCreator(creator);

    const [balance] = await db
      .select()
      .from(creatorBalances)
      .where(eq(creatorBalances.creatorId, creator.id))
      .limit(1);

    // 残高レコードがなければ初期値を返す
    if (!balance) {
      return {
        availableBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        withdrawalFee: WITHDRAWAL_FEE,
        minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
      };
    }

    return {
      ...balance,
      withdrawalFee: WITHDRAWAL_FEE,
      minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
    };
  }),

  // 銀行口座一覧を取得
  getBankAccounts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    assertDb(db);

    const [creator] = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, ctx.user.id))
      .limit(1);
    assertCreator(creator);

    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.creatorId, creator.id))
      .orderBy(sql`${bankAccounts.isDefault} DESC, ${bankAccounts.createdAt} DESC`);

    // Mask account numbers for display
    return accounts.map((account) => ({
      ...account,
      accountNumber: maskAccountNumber(
        isEncrypted(account.accountNumber)
          ? decrypt(account.accountNumber)
          : account.accountNumber
      ),
    }));
  }),

  // 銀行口座を登録
  addBankAccount: protectedProcedure
    .input(
      z.object({
        bankName: z.string().min(1).max(64),
        bankCode: z.string().max(8).optional(),
        branchName: z.string().min(1).max(64),
        branchCode: z.string().max(8).optional(),
        accountType: z.enum(["普通", "当座"]),
        accountNumber: z.string().min(1).max(16),
        accountHolderName: z.string().min(1).max(64),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.userId, ctx.user.id))
        .limit(1);
      assertCreator(creator);

      // 既存のデフォルト口座がある場合、デフォルトを解除
      if (input.isDefault) {
        await db
          .update(bankAccounts)
          .set({ isDefault: 0, updatedAt: new Date() })
          .where(eq(bankAccounts.creatorId, creator.id));
      }

      // Encrypt account number before storing
      const encryptedAccountNumber = encrypt(input.accountNumber);

      const [account] = await db
        .insert(bankAccounts)
        .values({
          creatorId: creator.id,
          bankName: input.bankName,
          bankCode: input.bankCode,
          branchName: input.branchName,
          branchCode: input.branchCode,
          accountType: input.accountType,
          accountNumber: encryptedAccountNumber,
          accountHolderName: input.accountHolderName,
          isDefault: input.isDefault ? 1 : 0,
        })
        .returning();

      // Return with masked account number
      return {
        ...account,
        accountNumber: maskAccountNumber(input.accountNumber),
      };
    }),

  // 銀行口座を削除
  deleteBankAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.userId, ctx.user.id))
        .limit(1);
      assertCreator(creator);

      // 自分の口座かチェック
      const [account] = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.id, input.id))
        .limit(1);

      if (!account || account.creatorId !== creator.id) {
        throwBadRequest("口座が見つかりません");
      }

      await db.delete(bankAccounts).where(eq(bankAccounts.id, input.id));

      return { success: true };
    }),

  // デフォルト口座を設定
  setDefaultBankAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.userId, ctx.user.id))
        .limit(1);
      assertCreator(creator);

      // 自分の口座かチェック
      const [account] = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.id, input.id))
        .limit(1);

      if (!account || account.creatorId !== creator.id) {
        throwBadRequest("口座が見つかりません");
      }

      // すべてのデフォルトを解除
      await db
        .update(bankAccounts)
        .set({ isDefault: 0, updatedAt: new Date() })
        .where(eq(bankAccounts.creatorId, creator.id));

      // 指定した口座をデフォルトに
      await db
        .update(bankAccounts)
        .set({ isDefault: 1, updatedAt: new Date() })
        .where(eq(bankAccounts.id, input.id));

      return { success: true };
    }),

  // 振込申請一覧を取得
  getWithdrawals: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.userId, ctx.user.id))
        .limit(1);
      assertCreator(creator);

      const limit = input.limit || 20;

      const results = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.creatorId, creator.id))
        .orderBy(sql`${withdrawals.createdAt} DESC`)
        .limit(limit);

      // Mask account numbers for display
      return results.map((withdrawal) => ({
        ...withdrawal,
        accountNumber: maskAccountNumber(
          isEncrypted(withdrawal.accountNumber)
            ? decrypt(withdrawal.accountNumber)
            : withdrawal.accountNumber
        ),
      }));
    }),

  // 振込申請を作成
  requestWithdrawal: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(MIN_WITHDRAWAL_AMOUNT).max(1_000_000_000),
        bankAccountId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.userId, ctx.user.id))
        .limit(1);
      assertCreator(creator);

      // 残高チェック
      const [balance] = await db
        .select()
        .from(creatorBalances)
        .where(eq(creatorBalances.creatorId, creator.id))
        .limit(1);

      if (!balance || balance.availableBalance < input.amount) {
        throwBadRequest("振込可能残高が不足しています");
      }

      // 銀行口座チェック
      const [account] = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.id, input.bankAccountId))
        .limit(1);

      if (!account || account.creatorId !== creator.id) {
        throwBadRequest("銀行口座が見つかりません");
      }

      // 手数料を計算
      const fee = WITHDRAWAL_FEE;
      const netAmount = input.amount - fee;

      if (netAmount <= 0) {
        throwBadRequest("振込金額が手数料を下回っています");
      }

      // Decrypt account number for withdrawal record (stored encrypted in withdrawals table too)
      const decryptedAccountNumber = isEncrypted(account.accountNumber)
        ? decrypt(account.accountNumber)
        : account.accountNumber;

      // Store encrypted account number in withdrawal record
      const encryptedAccountNumber = isEncrypted(account.accountNumber)
        ? account.accountNumber
        : encrypt(decryptedAccountNumber);

      // 振込申請を作成
      const [withdrawal] = await db
        .insert(withdrawals)
        .values({
          creatorId: creator.id,
          amount: input.amount,
          fee,
          netAmount,
          bankName: account.bankName,
          branchName: account.branchName,
          accountType: account.accountType,
          accountNumber: encryptedAccountNumber,
          accountHolderName: account.accountHolderName,
        })
        .returning();

      // 残高を減らす
      await db
        .update(creatorBalances)
        .set({
          availableBalance: sql`${creatorBalances.availableBalance} - ${input.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(creatorBalances.creatorId, creator.id));

      return withdrawal;
    }),

  // 振込申請をキャンセル（pending状態のみ）
  cancelWithdrawal: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      assertDb(db);

      const [creator] = await db
        .select()
        .from(creators)
        .where(eq(creators.userId, ctx.user.id))
        .limit(1);
      assertCreator(creator);

      // 申請チェック
      const [withdrawal] = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.id, input.id))
        .limit(1);

      if (!withdrawal || withdrawal.creatorId !== creator.id) {
        throwBadRequest("振込申請が見つかりません");
      }

      if (withdrawal.status !== "pending") {
        throwBadRequest("この振込申請はキャンセルできません");
      }

      // ステータスを更新
      await db
        .update(withdrawals)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(withdrawals.id, input.id));

      // 残高を戻す
      await db
        .update(creatorBalances)
        .set({
          availableBalance: sql`${creatorBalances.availableBalance} + ${withdrawal.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(creatorBalances.creatorId, creator.id));

      return { success: true };
    }),
});
