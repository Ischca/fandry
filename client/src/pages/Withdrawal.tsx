import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Header } from "@/components/Header";
import { trpc } from "@/lib/trpc";
import {
  Wallet,
  Building2,
  Plus,
  Trash2,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  Sparkles,
  Ban,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { label: "申請中", icon: Clock, color: "text-yellow-600 bg-yellow-500/10" },
  processing: { label: "処理中", icon: AlertCircle, color: "text-blue-600 bg-blue-500/10" },
  completed: { label: "完了", icon: CheckCircle2, color: "text-green-600 bg-green-500/10" },
  rejected: { label: "却下", icon: XCircle, color: "text-red-600 bg-red-500/10" },
  cancelled: { label: "キャンセル", icon: Ban, color: "text-gray-600 bg-gray-500/10" },
};

export default function Withdrawal() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  // Form state for new bank account
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountType, setAccountType] = useState<"普通" | "当座">("普通");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const utils = trpc.useUtils();

  const { data: balance, isLoading: loadingBalance } = trpc.withdrawal.getBalance.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: bankAccounts, isLoading: loadingAccounts } =
    trpc.withdrawal.getBankAccounts.useQuery(undefined, { enabled: isAuthenticated });

  const { data: withdrawals, isLoading: loadingWithdrawals } =
    trpc.withdrawal.getWithdrawals.useQuery({ limit: 20 }, { enabled: isAuthenticated });

  const addAccountMutation = trpc.withdrawal.addBankAccount.useMutation({
    onSuccess: () => {
      toast.success("銀行口座を登録しました");
      utils.withdrawal.getBankAccounts.invalidate();
      setIsAddingAccount(false);
      resetAccountForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteAccountMutation = trpc.withdrawal.deleteBankAccount.useMutation({
    onSuccess: () => {
      toast.success("銀行口座を削除しました");
      utils.withdrawal.getBankAccounts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const setDefaultMutation = trpc.withdrawal.setDefaultBankAccount.useMutation({
    onSuccess: () => {
      toast.success("デフォルト口座を変更しました");
      utils.withdrawal.getBankAccounts.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const requestWithdrawalMutation = trpc.withdrawal.requestWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("振込申請を送信しました");
      utils.withdrawal.getBalance.invalidate();
      utils.withdrawal.getWithdrawals.invalidate();
      setIsRequesting(false);
      setWithdrawalAmount("");
      setSelectedAccountId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelWithdrawalMutation = trpc.withdrawal.cancelWithdrawal.useMutation({
    onSuccess: () => {
      toast.success("振込申請をキャンセルしました");
      utils.withdrawal.getBalance.invalidate();
      utils.withdrawal.getWithdrawals.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetAccountForm = () => {
    setBankName("");
    setBranchName("");
    setAccountType("普通");
    setAccountNumber("");
    setAccountHolderName("");
  };

  const handleAddAccount = () => {
    if (!bankName || !branchName || !accountNumber || !accountHolderName) {
      toast.error("すべての項目を入力してください");
      return;
    }
    addAccountMutation.mutate({
      bankName,
      branchName,
      accountType,
      accountNumber,
      accountHolderName,
      isDefault: !bankAccounts || bankAccounts.length === 0,
    });
  };

  const handleRequestWithdrawal = () => {
    const amount = parseInt(withdrawalAmount);
    if (isNaN(amount) || amount < (balance?.minWithdrawalAmount || 1000)) {
      toast.error(`最低振込金額は¥${balance?.minWithdrawalAmount?.toLocaleString() || 1000}です`);
      return;
    }
    if (!selectedAccountId) {
      toast.error("振込先口座を選択してください");
      return;
    }
    if (amount > (balance?.availableBalance || 0)) {
      toast.error("振込可能残高を超えています");
      return;
    }
    requestWithdrawalMutation.mutate({
      amount,
      bankAccountId: selectedAccountId,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const defaultAccount = bankAccounts?.find((a) => a.isDefault === 1);
  const fee = balance?.withdrawalFee || 300;
  const withdrawalAmountNum = parseInt(withdrawalAmount) || 0;
  const netAmount = Math.max(0, withdrawalAmountNum - fee);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">振込申請</h1>
            <p className="text-muted-foreground">売上を銀行口座に振り込む</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2">
              ダッシュボード
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loadingBalance ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* 残高カード */}
            <Card className="p-6 mb-8 bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5 border-green-500/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    振込可能残高
                  </p>
                  <p className="text-4xl font-bold text-green-600">
                    ¥{(balance?.availableBalance || 0).toLocaleString()}
                  </p>
                  {(balance?.pendingBalance || 0) > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      保留中: ¥{balance?.pendingBalance.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted-foreground">
                    累計売上: ¥{(balance?.totalEarned || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    累計振込: ¥{(balance?.totalWithdrawn || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* 振込申請フォーム */}
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  振込申請
                </h2>

                {!bankAccounts || bankAccounts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>まず銀行口座を登録してください</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>振込先口座</Label>
                      <Select
                        value={selectedAccountId?.toString() || ""}
                        onValueChange={(v) => setSelectedAccountId(parseInt(v))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="口座を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.bankName} {account.branchName} {account.accountType}{" "}
                              {account.accountNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>振込金額</Label>
                      <Input
                        type="number"
                        placeholder={`最低 ¥${balance?.minWithdrawalAmount?.toLocaleString() || 1000}`}
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        振込手数料: ¥{fee.toLocaleString()}
                      </p>
                    </div>

                    {withdrawalAmountNum > 0 && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex justify-between text-sm">
                          <span>振込金額</span>
                          <span>¥{withdrawalAmountNum.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>手数料</span>
                          <span>-¥{fee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold mt-2 pt-2 border-t">
                          <span>振込額</span>
                          <span className="text-green-600">¥{netAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={
                        !selectedAccountId ||
                        withdrawalAmountNum < (balance?.minWithdrawalAmount || 1000) ||
                        withdrawalAmountNum > (balance?.availableBalance || 0) ||
                        requestWithdrawalMutation.isPending
                      }
                      onClick={handleRequestWithdrawal}
                    >
                      {requestWithdrawalMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      振込を申請する
                    </Button>
                  </div>
                )}
              </Card>

              {/* 銀行口座管理 */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    銀行口座
                  </h2>
                  <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="h-4 w-4" />
                        追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>銀行口座を登録</DialogTitle>
                        <DialogDescription>
                          振込先の銀行口座情報を入力してください
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>銀行名</Label>
                            <Input
                              placeholder="三菱UFJ銀行"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>支店名</Label>
                            <Input
                              placeholder="渋谷支店"
                              value={branchName}
                              onChange={(e) => setBranchName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>口座種別</Label>
                            <Select
                              value={accountType}
                              onValueChange={(v) => setAccountType(v as "普通" | "当座")}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="普通">普通</SelectItem>
                                <SelectItem value="当座">当座</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>口座番号</Label>
                            <Input
                              placeholder="1234567"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>口座名義（カタカナ）</Label>
                          <Input
                            placeholder="ヤマダ タロウ"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddingAccount(false);
                            resetAccountForm();
                          }}
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleAddAccount}
                          disabled={addAccountMutation.isPending}
                        >
                          {addAccountMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          登録
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : bankAccounts && bankAccounts.length > 0 ? (
                  <div className="space-y-3">
                    {bankAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {account.isDefault === 1 && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {account.bankName} {account.branchName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {account.accountType} {account.accountNumber} / {account.accountHolderName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {account.isDefault !== 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => setDefaultMutation.mutate({ id: account.id })}
                              disabled={setDefaultMutation.isPending}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteAccountMutation.mutate({ id: account.id })}
                            disabled={deleteAccountMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>銀行口座が登録されていません</p>
                  </div>
                )}
              </Card>
            </div>

            {/* 申請履歴 */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                申請履歴
              </h2>
              {loadingWithdrawals ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : withdrawals && withdrawals.length > 0 ? (
                <div className="space-y-3">
                  {withdrawals.map((withdrawal) => {
                    const statusConfig = STATUS_CONFIG[withdrawal.status];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={withdrawal.id}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.color}`}
                          >
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold">
                              ¥{withdrawal.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {withdrawal.bankName} {withdrawal.branchName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(withdrawal.createdAt).toLocaleDateString("ja-JP")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                            <p className="text-sm text-muted-foreground mt-1">
                              実振込: ¥{withdrawal.netAmount.toLocaleString()}
                            </p>
                          </div>
                          {withdrawal.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                cancelWithdrawalMutation.mutate({ id: withdrawal.id })
                              }
                              disabled={cancelWithdrawalMutation.isPending}
                            >
                              キャンセル
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>振込申請履歴がありません</p>
                </div>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
