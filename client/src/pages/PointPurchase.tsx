import { useState } from "react";
import { Coins, CreditCard, History, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PointPurchase() {
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: balance } = trpc.point.getBalance.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: packages } = trpc.point.getPackages.useQuery();
  const { data: transactions } = trpc.point.getTransactions.useQuery(
    { limit: 20 },
    { enabled: !!user }
  );

  const createCheckout = trpc.point.createCheckoutSession.useMutation();

  if (!user) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              ポイントを購入するにはログインしてください
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePurchase = async (packageId: number) => {
    setSelectedPackageId(packageId);
    setIsLoading(true);

    try {
      const result = await createCheckout.mutateAsync({
        packageId,
        successUrl: `${window.location.origin}/points?success=true`,
        cancelUrl: `${window.location.origin}/points?canceled=true`,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setIsLoading(false);
      setSelectedPackageId(null);
    }
  };

  // Check for success/canceled query params
  const params = new URLSearchParams(window.location.search);
  const isSuccess = params.get("success") === "true";
  const isCanceled = params.get("canceled") === "true";

  return (
    <div className="container max-w-4xl py-8">
      {/* Success/Cancel messages */}
      {isSuccess && (
        <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                ポイント購入が完了しました
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                残高が更新されました
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {isCanceled && (
        <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-yellow-500" />
            <p className="font-medium text-yellow-700 dark:text-yellow-400">
              購入がキャンセルされました
            </p>
          </CardContent>
        </Card>
      )}

      {/* Balance Card */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Coins className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">現在の残高</p>
                <p className="text-3xl font-bold">
                  {balance?.balance?.toLocaleString() ?? 0}
                  <span className="text-lg font-normal text-muted-foreground ml-1">pt</span>
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>累計購入: {balance?.totalPurchased?.toLocaleString() ?? 0} pt</p>
              <p>累計利用: {balance?.totalSpent?.toLocaleString() ?? 0} pt</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="purchase">
        <TabsList className="mb-6">
          <TabsTrigger value="purchase" className="gap-2">
            <CreditCard className="h-4 w-4" />
            ポイント購入
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            履歴
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchase">
          <Card>
            <CardHeader>
              <CardTitle>ポイントパッケージ</CardTitle>
              <CardDescription>
                1ポイント = 1円でご利用いただけます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {packages?.map((pkg) => (
                  <Card
                    key={pkg.id}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedPackageId === pkg.id ? "border-primary ring-2 ring-primary" : ""
                    }`}
                    onClick={() => !isLoading && handlePurchase(pkg.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Coins className="h-5 w-5 text-yellow-500" />
                          <span className="text-2xl font-bold">
                            {pkg.points.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">pt</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">
                          ¥{pkg.priceJpy.toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          disabled={isLoading && selectedPackageId === pkg.id}
                        >
                          {isLoading && selectedPackageId === pkg.id ? (
                            "処理中..."
                          ) : (
                            <>
                              購入
                              <ArrowRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!packages?.length && (
                <p className="text-center text-muted-foreground py-8">
                  現在購入可能なパッケージはありません
                </p>
              )}

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">ポイントについて</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ポイントは有料コンテンツの購入、サブスクリプション、チップに使えます</li>
                  <li>• アダルトコンテンツはポイントでのみ購入可能です</li>
                  <li>• ポイントの有効期限はありません</li>
                  <li>• 購入後の返金はできません</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>ポイント履歴</CardTitle>
              <CardDescription>
                最近のポイント取引履歴
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions?.length ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            tx.amount > 0
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-red-100 dark:bg-red-900"
                          }`}
                        >
                          <Coins
                            className={`h-4 w-4 ${
                              tx.amount > 0 ? "text-green-500" : "text-red-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {tx.description || getTransactionLabel(tx.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString("ja-JP", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            tx.amount > 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount.toLocaleString()} pt
                        </p>
                        <p className="text-xs text-muted-foreground">
                          残高: {tx.balanceAfter.toLocaleString()} pt
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  取引履歴がありません
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getTransactionLabel(type: string): string {
  switch (type) {
    case "purchase":
      return "ポイント購入";
    case "refund":
      return "返金";
    case "post_purchase":
      return "コンテンツ購入";
    case "subscription":
      return "サブスクリプション";
    case "tip":
      return "チップ";
    case "admin_grant":
      return "管理者付与";
    default:
      return type;
  }
}
