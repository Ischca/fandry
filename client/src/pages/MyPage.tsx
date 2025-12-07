import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Header } from "@/components/Header";
import {
  Heart,
  User,
  FileText,
  Crown,
  Users,
  TrendingUp,
  LogOut,
  Plus,
  Edit2,
  Eye,
  Trophy,
  BarChart3,
  Sparkles,
  Zap,
  Star,
  ArrowUpRight,
  ImageIcon,
  Settings,
} from "lucide-react";
import { Link } from "wouter";
import {
  ShareCard,
  StatCard,
  ActionCard,
  RecentPostCard,
} from "./mypage-components";

export default function MyPage() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: creatorProfile } = trpc.creator.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: myPosts } = trpc.post.getMyPosts.useQuery(
    { limit: 6 },
    { enabled: isAuthenticated && !!creatorProfile }
  );

  const { data: myPlans } = trpc.subscriptionPlan.getMyPlans.useQuery(
    undefined,
    {
      enabled: isAuthenticated && !!creatorProfile,
    }
  );

  const totalSubscribers =
    myPlans?.reduce((acc, plan) => acc + plan.subscriberCount, 0) || 0;

  if (loading || !mounted) {
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-background via-background to-primary/5">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <User className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            ログインが必要です
          </h1>
          <p className="text-muted-foreground max-w-sm">
            マイページを表示するにはログインしてください
          </p>
        </div>
        <SignInButton mode="modal">
          <Button size="lg" className="gap-2 font-semibold">
            <Zap className="h-4 w-4" />
            ログイン
          </Button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[oklch(0.85_0.16_85)]/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(224,90,58,0.08),transparent_50%)]" />

        <div className="container max-w-6xl relative py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end gap-8">
            <div className="flex items-start gap-6 flex-1">
              <div className="relative group">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-3xl bg-card shadow-2xl shadow-black/10 overflow-hidden ring-4 ring-background transition-transform group-hover:scale-105">
                  {creatorProfile?.avatarUrl ? (
                    <img
                      src={creatorProfile.avatarUrl}
                      alt={creatorProfile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <User className="h-16 w-16 text-primary" />
                    </div>
                  )}
                </div>
                {creatorProfile && (
                  <Link href="/settings/profile">
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-card shadow-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 transition-all">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </Link>
                )}
              </div>

              <div className="flex-1 pt-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    {creatorProfile?.displayName || user?.name || "ユーザー"}
                  </h1>
                  {creatorProfile && (
                    <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      クリエイター
                    </div>
                  )}
                </div>

                {creatorProfile && (
                  <p className="text-muted-foreground text-lg">
                    @{creatorProfile.username}
                  </p>
                )}

                <p className="text-sm text-muted-foreground mt-2">
                  {user?.email}
                </p>

                {creatorProfile?.bio && (
                  <p className="mt-4 text-foreground/80 max-w-md line-clamp-2">
                    {creatorProfile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {creatorProfile && (
                <>
                  <Link href={`/creator/${creatorProfile.username}`}>
                    <Button variant="outline" size="lg" className="gap-2">
                      <Eye className="h-4 w-4" />
                      プロフィールを見る
                    </Button>
                  </Link>
                  <ShareCard
                    username={creatorProfile.username}
                    displayName={creatorProfile.displayName}
                    avatarUrl={creatorProfile.avatarUrl}
                    followerCount={creatorProfile.followerCount}
                    totalSupport={creatorProfile.totalSupport}
                  />
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container max-w-6xl pb-16">
        {creatorProfile ? (
          <>
            {/* Stats Bento Grid */}
            <section className="mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={TrendingUp}
                  value={`¥${creatorProfile.totalSupport.toLocaleString()}`}
                  label="累計サポート"
                  accent
                  large
                />
                <StatCard
                  icon={Users}
                  value={creatorProfile.followerCount}
                  label="フォロワー"
                />
                <StatCard
                  icon={Crown}
                  value={totalSubscribers}
                  label="メンバー"
                />
                <StatCard
                  icon={FileText}
                  value={myPosts?.length || 0}
                  label="投稿数"
                />
                <StatCard
                  icon={Heart}
                  value={myPosts?.reduce((acc, p) => acc + p.likeCount, 0) || 0}
                  label="総いいね"
                />
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                  クイックアクション
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ActionCard
                  icon={Plus}
                  title="新規投稿"
                  description="コンテンツを作成して公開"
                  href="/create-post"
                  color="primary"
                />
                <ActionCard
                  icon={Crown}
                  title="プラン管理"
                  description={`${myPlans?.length || 0}件のプラン`}
                  href="/manage-plans"
                  color="gold"
                />
                <ActionCard
                  icon={BarChart3}
                  title="収益ダッシュボード"
                  description="詳細な収益分析"
                  href="/dashboard"
                  color="green"
                />
                <ActionCard
                  icon={Trophy}
                  title="ランキング"
                  description="あなたの順位を確認"
                  href="/ranking"
                  color="violet"
                />
              </div>
            </section>

            {/* Recent Posts */}
            {myPosts && myPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">
                    最近の投稿
                  </h2>
                  <Link href="/manage-posts">
                    <Button
                      variant="ghost"
                      className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                      すべて見る
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myPosts.slice(0, 6).map(post => (
                    <RecentPostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State for Posts */}
            {(!myPosts || myPosts.length === 0) && (
              <section className="text-center py-16">
                <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  まだ投稿がありません
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  最初のコンテンツを投稿して、ファンとつながりましょう
                </p>
                <Link href="/create-post">
                  <Button size="lg" className="gap-2">
                    <Plus className="h-4 w-4" />
                    最初の投稿を作成
                  </Button>
                </Link>
              </section>
            )}
          </>
        ) : (
          /* Non-creator CTA */
          <section className="py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-[oklch(0.85_0.16_85)]/20 flex items-center justify-center mx-auto mb-8">
                <Crown className="h-12 w-12 text-primary" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight mb-4">
                クリエイターになりませんか？
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                ファンからの応援を受け取り、あなたの活動を支援してもらいましょう
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/become-creator">
                  <Button
                    size="lg"
                    className="gap-2 font-semibold w-full sm:w-auto"
                  >
                    <Sparkles className="h-4 w-4" />
                    クリエイター登録
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Users className="h-4 w-4" />
                    クリエイターを探す
                  </Button>
                </Link>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
                {[
                  { icon: Heart, title: "チップ機能", desc: "ファンから直接応援" },
                  {
                    icon: Crown,
                    title: "メンバーシップ",
                    desc: "月額サブスクリプション",
                  },
                  {
                    icon: FileText,
                    title: "有料コンテンツ",
                    desc: "限定コンテンツ販売",
                  },
                ].map((feature, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-card border border-border/50"
                  >
                    <feature.icon className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Quick Links Footer */}
        <section className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/feed">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <Heart className="h-4 w-4" />
                フィード
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                クリエイターを探す
              </Button>
            </Link>
            <Link href="/points">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                ポイント
              </Button>
            </Link>
            <Link href="/settings/profile">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <Settings className="h-4 w-4" />
                設定
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
