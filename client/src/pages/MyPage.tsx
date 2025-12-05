import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Header } from "@/components/Header";
import {
  Heart,
  User,
  FileText,
  Crown,
  Users,
  TrendingUp,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Plus,
  Edit2,
  Eye,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function MyPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  // Get creator profile for the current user
  const { data: creatorProfile } = trpc.creator.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get my posts count
  const { data: myPosts } = trpc.post.getMyPosts.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated && !!creatorProfile }
  );

  // Get my plans
  const { data: myPlans } = trpc.subscriptionPlan.getMyPlans.useQuery(undefined, {
    enabled: isAuthenticated && !!creatorProfile,
  });

  const handleCopyTipLink = async () => {
    if (!creatorProfile) return;
    const tipUrl = `${window.location.origin}/tip/${creatorProfile.username}`;
    try {
      await navigator.clipboard.writeText(tipUrl);
      setCopied(true);
      toast.success("チップリンクをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">ログインが必要です</h1>
        <p className="text-muted-foreground">
          マイページを表示するにはログインしてください
        </p>
        <SignInButton mode="modal">
          <Button>ログイン</Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* メインコンテンツ */}
      <main className="container max-w-4xl py-8">
        {/* プロフィールセクション */}
        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {creatorProfile?.avatarUrl ? (
                <img
                  src={creatorProfile.avatarUrl}
                  alt={creatorProfile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {creatorProfile?.displayName || user?.name || "ユーザー"}
              </h1>
              {creatorProfile && (
                <p className="text-muted-foreground">@{creatorProfile.username}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            </div>
            <div className="flex gap-2">
              {creatorProfile && (
                <>
                  <Link href={`/creator/${creatorProfile.username}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      表示
                    </Button>
                  </Link>
                  <Link href="/settings/profile">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Edit2 className="h-4 w-4" />
                      編集
                    </Button>
                  </Link>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                ログアウト
              </Button>
            </div>
          </div>
        </Card>

        {/* クリエイター向けセクション */}
        {creatorProfile ? (
          <>
            {/* 統計 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">
                  ¥{creatorProfile.totalSupport.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">累計サポート</p>
              </Card>
              <Card className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">
                  {creatorProfile.followerCount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">フォロワー</p>
              </Card>
              <Card className="p-4 text-center">
                <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{myPosts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">投稿数</p>
              </Card>
            </div>

            {/* チップリンク */}
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">チップリンク</p>
                    <p className="text-sm text-muted-foreground">
                      SNSでシェアして応援を受け取ろう
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyTipLink}
                    className="gap-2"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    コピー
                  </Button>
                  <Link href={`/tip/${creatorProfile.username}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      開く
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* 管理メニュー */}
            <h2 className="text-lg font-bold mb-4">クリエイター管理</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Link href="/create-post">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">新規投稿</p>
                      <p className="text-sm text-muted-foreground">投稿を作成</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/manage-posts">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">投稿管理</p>
                      <p className="text-sm text-muted-foreground">
                        {myPosts?.length || 0}件の投稿
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/manage-plans">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">プラン管理</p>
                      <p className="text-sm text-muted-foreground">
                        {myPlans?.length || 0}件のプラン
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/ranking">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">ランキング</p>
                      <p className="text-sm text-muted-foreground">順位を確認</p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/dashboard">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">収益ダッシュボード</p>
                      <p className="text-sm text-muted-foreground">収益を確認</p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {/* 最近の投稿 */}
            {myPosts && myPosts.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">最近の投稿</h2>
                  <Link href="/manage-posts">
                    <Button variant="ghost" size="sm">
                      すべて見る
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {myPosts.slice(0, 3).map((post) => (
                    <Card key={post.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {post.title || post.content.substring(0, 50)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{post.type === "free" ? "無料" : post.type === "paid" ? "有料" : "会員限定"}</span>
                            <span>
                              {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                            </span>
                          </div>
                        </div>
                        <Link href={`/edit-post/${post.id}`}>
                          <Button variant="ghost" size="icon">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* ファン向けセクション（クリエイターでない場合） */
          <Card className="p-8 text-center">
            <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">クリエイターになりませんか？</h2>
            <p className="text-muted-foreground mb-4">
              ファンからの応援を受け取って活動を広げましょう
            </p>
            <Link href="/become-creator">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                クリエイター登録
              </Button>
            </Link>
          </Card>
        )}

        {/* クイックリンク */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/feed">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <p className="font-medium">フィード</p>
              </div>
            </Card>
          </Link>
          <Link href="/discover">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <p className="font-medium">クリエイターを探す</p>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
