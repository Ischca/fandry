import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Gift,
  Crown,
  Calendar,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";

function formatChange(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) {
    return current > 0 ? { text: "+100%", positive: true } : { text: "±0%", positive: true };
  }
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return {
    text: `${sign}${change.toFixed(0)}%`,
    positive: change >= 0,
  };
}

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: summary, isLoading: loadingSummary } = trpc.revenue.getSummary.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: transactions, isLoading: loadingTransactions } =
    trpc.revenue.getRecentTransactions.useQuery(
      { limit: 10 },
      { enabled: isAuthenticated }
    );

  const { data: subscribers, isLoading: loadingSubscribers } =
    trpc.revenue.getSubscribers.useQuery(
      { limit: 10 },
      { enabled: isAuthenticated }
    );

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

  const monthChange = summary?.thisMonth && summary?.lastMonth
    ? formatChange(summary.thisMonth.total, summary.lastMonth.total)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      <main className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">収益ダッシュボード</h1>
            <p className="text-muted-foreground">詳細な収益分析と売上状況</p>
          </div>
          <Link href="/my">
            <Button variant="outline" className="gap-2">
              マイページ
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loadingSummary ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : summary ? (
          <>
            {/* 今月の収益ハイライト */}
            <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 via-background to-[oklch(0.85_0.16_85)]/5 border-primary/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">今月の収益</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold">
                      ¥{summary.thisMonth?.total.toLocaleString() || 0}
                    </span>
                    {monthChange && (
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${
                          monthChange.positive
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {monthChange.positive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {monthChange.text} 先月比
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.activeSubscribers}</p>
                    <p className="text-xs text-muted-foreground">アクティブ会員</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{summary.followerCount}</p>
                    <p className="text-xs text-muted-foreground">フォロワー</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 収益サマリーカード */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ¥{summary.totalSupport.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">累計収益</p>
              </Card>

              <Card className="p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ¥{summary.tipTotal.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  チップ総額 ({summary.tipCount}件)
                </p>
              </Card>

              <Card className="p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ¥{summary.purchasesTotal.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">コンテンツ販売</p>
              </Card>

              <Card className="p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  ¥{summary.mrr.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">月額収益 (MRR)</p>
              </Card>
            </div>

            {/* 月次比較 */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">今月の内訳</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">チップ</span>
                    </div>
                    <span className="font-bold">
                      ¥{(summary.thisMonth?.tips || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">コンテンツ販売</span>
                    </div>
                    <span className="font-bold">
                      ¥{(summary.thisMonth?.purchases || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-purple-500" />
                      <span className="text-muted-foreground">サブスクリプション</span>
                    </div>
                    <span className="font-bold">
                      ¥{(summary.thisMonth?.subscriptions || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">合計</span>
                      <span className="font-bold text-lg">
                        ¥{(summary.thisMonth?.total || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4">先月との比較</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">先月のチップ</span>
                    <span className="font-bold">
                      ¥{(summary.lastMonth?.tips || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">先月のコンテンツ販売</span>
                    <span className="font-bold">
                      ¥{(summary.lastMonth?.purchases || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">先月合計</span>
                      <span className="font-bold text-lg">
                        ¥{(summary.lastMonth?.total || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {monthChange && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        monthChange.positive ? "bg-green-500/10" : "bg-red-500/10"
                      }`}
                    >
                      {monthChange.positive ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600" />
                      )}
                      <span
                        className={`font-medium ${
                          monthChange.positive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {monthChange.text} 先月比
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* 最近のトランザクションとサブスクライバー */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  最近の収益
                </h2>
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={`${tx.type}-${tx.id}`}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === "tip"
                                ? "bg-primary/10"
                                : "bg-blue-500/10"
                            }`}
                          >
                            {tx.type === "tip" ? (
                              <Gift className="h-5 w-5 text-primary" />
                            ) : (
                              <ShoppingCart className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {tx.type === "tip" ? "チップ" : "コンテンツ購入"}
                            </p>
                            {tx.message && (
                              <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                                {tx.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            +¥{tx.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>まだ収益がありません</p>
                    <p className="text-sm mt-1">
                      コンテンツをシェアして応援を受け取りましょう
                    </p>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  アクティブサブスクライバー
                </h2>
                {loadingSubscribers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : subscribers && subscribers.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {subscribers.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Crown className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium">{sub.planName}</p>
                            <p className="text-sm text-muted-foreground">
                              ¥{sub.planPrice.toLocaleString()}/月
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            開始: {new Date(sub.startedAt).toLocaleDateString("ja-JP")}
                          </p>
                          {sub.nextBillingAt && (
                            <p className="text-xs text-muted-foreground">
                              次回: {new Date(sub.nextBillingAt).toLocaleDateString("ja-JP")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>まだサブスクライバーがいません</p>
                    <p className="text-sm mt-1">
                      月額プランを作成してファンを増やしましょう
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* クイックアクション */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              <Link href="/withdrawal">
                <Card className="p-4 hover:shadow-md hover:border-green-500/20 transition-all cursor-pointer text-center bg-green-500/5">
                  <p className="font-medium text-green-600">振込申請</p>
                </Card>
              </Link>
              <Link href="/manage-posts">
                <Card className="p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer text-center">
                  <p className="font-medium">投稿管理</p>
                </Card>
              </Link>
              <Link href="/manage-plans">
                <Card className="p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer text-center">
                  <p className="font-medium">プラン管理</p>
                </Card>
              </Link>
              <Link href="/create-post">
                <Card className="p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer text-center">
                  <p className="font-medium">新規投稿</p>
                </Card>
              </Link>
              <Link href="/settings/profile">
                <Card className="p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer text-center">
                  <p className="font-medium">設定</p>
                </Card>
              </Link>
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">
              クリエイター登録が必要です
            </h2>
            <p className="text-muted-foreground mb-4">
              ダッシュボードを表示するにはクリエイター登録してください
            </p>
            <Link href="/become-creator">
              <Button>クリエイター登録</Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
