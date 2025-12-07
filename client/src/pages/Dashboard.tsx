import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  TrendingUp,
  DollarSign,
  Gift,
  Crown,
  Calendar,
} from "lucide-react";
import { Link, useLocation } from "wouter";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/my">
              <Button variant="ghost">マイページ</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">収益ダッシュボード</h1>
            <p className="text-muted-foreground">収益状況を確認しましょう</p>
          </div>
        </div>

        {loadingSummary ? (
          <div className="text-center py-12 text-muted-foreground">
            読み込み中...
          </div>
        ) : summary ? (
          <>
            {/* 概要カード */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">累計収益</p>
                </div>
                <p className="text-2xl font-bold">
                  ¥{summary.totalSupport.toLocaleString()}
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">チップ</p>
                </div>
                <p className="text-2xl font-bold">
                  ¥{summary.tipTotal.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.tipCount}件
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">月額会員</p>
                </div>
                <p className="text-2xl font-bold">{summary.activeSubscribers}</p>
                <p className="text-xs text-muted-foreground">アクティブ</p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">月額収益</p>
                </div>
                <p className="text-2xl font-bold">
                  ¥{summary.mrr.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">MRR</p>
              </Card>
            </div>

            {/* 収益内訳 */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  チップ収益
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">総額</span>
                    <span className="font-bold">
                      ¥{summary.tipTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">受取件数</span>
                    <span className="font-bold">{summary.tipCount}件</span>
                  </div>
                  {summary.tipCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">平均金額</span>
                      <span className="font-bold">
                        ¥
                        {Math.round(
                          summary.tipTotal / summary.tipCount
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-500" />
                  サブスクリプション
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">月額収益 (MRR)</span>
                    <span className="font-bold">
                      ¥{summary.mrr.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">アクティブ会員</span>
                    <span className="font-bold">
                      {summary.activeSubscribers}人
                    </span>
                  </div>
                  {summary.activeSubscribers > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">平均単価</span>
                      <span className="font-bold">
                        ¥
                        {Math.round(
                          summary.mrr / summary.activeSubscribers
                        ).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* 最近のトランザクション */}
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                最近の収益
              </h2>
              {loadingTransactions ? (
                <p className="text-muted-foreground">読み込み中...</p>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Gift className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">チップ</p>
                          {tx.message && (
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
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
                    チップリンクをシェアして応援を受け取りましょう
                  </p>
                </div>
              )}
            </Card>

            {/* クイックアクション */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Link href="/manage-posts">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer text-center">
                  <p className="font-medium">投稿管理</p>
                </Card>
              </Link>
              <Link href="/manage-plans">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer text-center">
                  <p className="font-medium">プラン管理</p>
                </Card>
              </Link>
              <Link href="/my">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer text-center">
                  <p className="font-medium">マイページ</p>
                </Card>
              </Link>
              <Link href="/ranking">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer text-center">
                  <p className="font-medium">ランキング</p>
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
            <Link href="/my">
              <Button>マイページへ</Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
