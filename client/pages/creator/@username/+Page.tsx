import { useData } from "vike-react/useData";
import { Button } from "@/components/ui/button";
import {
  User,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Users,
  Sparkles,
  Crown,
  Star,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { Header } from "@/components/Header";
import { useState } from "react";
import type { CreatorPageData } from "./+data";
import {
  ShareDialog,
  PostPreviewCard,
  PlanCard,
  ClientOnlyAuthActions,
  isSafeUrl,
} from "./components";

export default function CreatorPage() {
  const { creator, posts, plans } = useData<CreatorPageData>();
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-background to-muted/30">
        <div className="w-28 h-28 rounded-3xl bg-muted/50 flex items-center justify-center">
          <User className="h-14 w-14 text-muted-foreground/40" />
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">
            クリエイターが見つかりません
          </h1>
          <p className="text-muted-foreground">URLを確認してください</p>
        </div>
        <Link href="/discover">
          <Button size="lg" className="gap-2">
            <Sparkles className="h-4 w-4" />
            クリエイターを探す
          </Button>
        </Link>
      </div>
    );
  }

  // Parse social links
  let socialLinks: Record<string, string> = {};
  try {
    socialLinks = creator.socialLinks ? JSON.parse(creator.socialLinks) : {};
  } catch {
    socialLinks = {};
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Hero Section */}
      <section className="relative">
        {/* Cover Image */}
        <div className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
          {creator.coverUrl ? (
            <img
              src={creator.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-[oklch(0.85_0.16_85)]/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(224,90,58,0.15),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(200,150,50,0.1),transparent_50%)]" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

          <div className="absolute top-6 right-6">
            <ShareDialog
              username={creator.username}
              displayName={creator.displayName}
            />
          </div>
        </div>

        {/* Profile Info Overlay */}
        <div className="container relative -mt-32 z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl border-4 border-background bg-card shadow-2xl overflow-hidden">
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <User className="h-20 w-20 text-primary" />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Star className="h-6 w-6 text-white fill-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 pt-4 md:pt-8 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {creator.displayName}
                  </h1>
                  {creator.category && (
                    <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {creator.category}
                    </span>
                  )}
                </div>
                <p className="text-xl text-muted-foreground">
                  @{creator.username}
                </p>
              </div>

              {creator.bio && (
                <p className="text-lg text-foreground/80 leading-relaxed max-w-2xl">
                  {creator.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {creator.followerCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">フォロワー</p>
                  </div>
                </div>

                {creator.totalSupport > 0 && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[oklch(0.85_0.16_85)]/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[oklch(0.7_0.14_85)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        ¥{creator.totalSupport.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">累計支援</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{posts?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">投稿</p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {Object.keys(socialLinks).length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  {socialLinks.twitter && isSafeUrl(socialLinks.twitter) && (
                    <a
                      href={socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.instagram && isSafeUrl(socialLinks.instagram) && (
                    <a
                      href={socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.youtube && isSafeUrl(socialLinks.youtube) && (
                    <a
                      href={socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <Youtube className="h-5 w-5" />
                    </a>
                  )}
                  {socialLinks.website && isSafeUrl(socialLinks.website) && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-xl bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container py-16 space-y-20">
        {/* Subscription Plans */}
        {plans && plans.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[oklch(0.85_0.16_85)] to-[oklch(0.7_0.14_85)] flex items-center justify-center shadow-lg shadow-[oklch(0.85_0.16_85)]/30">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  月額サポートプラン
                </h2>
                <p className="text-muted-foreground">
                  メンバー限定のコンテンツや特典を楽しもう
                </p>
              </div>
            </div>

            <div
              className={`grid gap-6 ${plans.length === 1 ? "max-w-md" : plans.length === 2 ? "md:grid-cols-2 max-w-2xl" : "md:grid-cols-3"}`}
            >
              {plans.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  featured={
                    plans.length > 1 && index === Math.floor(plans.length / 2)
                  }
                  onSubscribe={() => setSubscribeDialogOpen(true)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Posts */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.18_35)] flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">投稿</h2>
                <p className="text-muted-foreground">
                  最新のコンテンツをチェック
                </p>
              </div>
            </div>
          </div>

          {posts && posts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <PostPreviewCard
                  key={post.id}
                  post={post}
                  creator={{
                    username: creator.username,
                    displayName: creator.displayName,
                    avatarUrl: creator.avatarUrl,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                まだ投稿がありません
              </h3>
              <p className="text-muted-foreground">
                最初の投稿を楽しみにお待ちください
              </p>
            </div>
          )}
        </section>
      </div>

      <ClientOnlyAuthActions creator={creator} plans={plans} />

      {plans && plans.length > 0 && (
        <SubscribeDialog
          open={subscribeDialogOpen}
          onOpenChange={setSubscribeDialogOpen}
          plans={plans}
          creatorId={creator.id}
          creatorName={creator.displayName}
        />
      )}
    </div>
  );
}
