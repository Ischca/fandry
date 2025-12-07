import { useData } from "vike-react/useData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Users,
  Sparkles,
  Crown,
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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: "依頼受付中", color: "bg-green-500" },
  busy: { label: "制作中", color: "bg-yellow-500" },
  closed: { label: "依頼停止中", color: "bg-red-500" },
  custom: { label: "", color: "bg-blue-500" },
};

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

  // Parse skill tags
  let skillTags: string[] = [];
  try {
    skillTags = creator.skillTags ? JSON.parse(creator.skillTags) : [];
  } catch {
    skillTags = [];
  }

  // Get accent color
  const accentColor = creator.accentColor || "#E05A3A";

  // Get status config
  const statusConfig = creator.creatorStatus
    ? STATUS_CONFIG[creator.creatorStatus]
    : null;
  const statusLabel =
    creator.creatorStatus === "custom"
      ? creator.statusMessage
      : statusConfig?.label;

  return (
    <div
      className="min-h-screen bg-background pb-24"
      style={{ "--creator-accent": accentColor } as React.CSSProperties}
    >
      <Header />

      {/* Compact Hero Section */}
      <section className="relative">
        {/* Cover - smaller height */}
        <div className="relative h-32 md:h-40 overflow-hidden">
          {creator.coverUrl ? (
            <img
              src={creator.coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

          <div className="absolute top-4 right-4">
            <ShareDialog
              username={creator.username}
              displayName={creator.displayName}
            />
          </div>
        </div>

        {/* Profile content - centered, compact */}
        <div className="container max-w-2xl relative -mt-16 pb-6">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div
                className="w-28 h-28 rounded-full bg-card shadow-xl overflow-hidden"
                style={{ boxShadow: `0 0 0 4px ${accentColor}30` }}
              >
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`,
                    }}
                  >
                    <User className="h-12 w-12" style={{ color: accentColor }} />
                  </div>
                )}
              </div>
              {/* Status indicator on avatar */}
              {statusConfig && (
                <div
                  className={`absolute bottom-1 right-1 w-5 h-5 rounded-full ${statusConfig.color} ring-2 ring-background`}
                  title={statusLabel || undefined}
                />
              )}
            </div>

            {/* Identity */}
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {creator.displayName}
              </h1>
              {/* Creator title */}
              {creator.creatorTitle && (
                <p className="text-sm font-medium" style={{ color: accentColor }}>
                  {creator.creatorTitle}
                </p>
              )}
              <p className="text-muted-foreground text-sm">@{creator.username}</p>
            </div>

            {/* Status badge */}
            {statusLabel && (
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full text-white ${statusConfig?.color || "bg-blue-500"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                  {statusLabel}
                </span>
              </div>
            )}

            {/* Category badge */}
            {creator.category && (
              <div className="mt-2">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                  {creator.category}
                </span>
              </div>
            )}

            {/* Skill tags */}
            {skillTags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5 max-w-md">
                {skillTags.slice(0, 6).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs font-normal">
                    {tag}
                  </Badge>
                ))}
                {skillTags.length > 6 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{skillTags.length - 6}
                  </Badge>
                )}
              </div>
            )}

            {/* Bio */}
            {creator.bio && (
              <p className="mt-4 text-muted-foreground max-w-md leading-relaxed">
                {creator.bio}
              </p>
            )}

            {/* Stats */}
            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {creator.followerCount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground">フォロワー</span>
              </div>

              {creator.totalSupport > 0 && (
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    ¥{creator.totalSupport.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">累計支援</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{posts?.length || 0}</span>
                <span className="text-xs text-muted-foreground">投稿</span>
              </div>
            </div>

            {/* Social Links */}
            {Object.keys(socialLinks).length > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {socialLinks.twitter && isSafeUrl(socialLinks.twitter) && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.instagram && isSafeUrl(socialLinks.instagram) && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.youtube && isSafeUrl(socialLinks.youtube) && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <Youtube className="h-4 w-4" />
                  </a>
                )}
                {socialLinks.website && isSafeUrl(socialLinks.website) && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
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
