import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Share2, User, Twitter, Instagram, Youtube, Globe, MoreHorizontal, Flag, Ban, Copy, Check, Link as LinkIcon, Users, Sparkles, Crown } from "lucide-react";
import { useParams, Link } from "wouter";
import { TipDialog } from "@/components/TipDialog";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { PostCard } from "@/components/PostCard";
import { ReportDialog } from "@/components/ReportDialog";
import { Header } from "@/components/Header";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState } from "react";

export default function CreatorPage() {
  const { username } = useParams<{ username: string }>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const tipUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tip/${username}`
    : "";

  const handleCopyTipLink = async () => {
    try {
      await navigator.clipboard.writeText(tipUrl);
      setCopied(true);
      toast.success("チップリンクをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const { data: creator, isLoading: creatorLoading } = trpc.creator.getByUsername.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );

  const { data: posts, isLoading: postsLoading } = trpc.post.getByCreatorUsername.useQuery(
    { username: username || "", limit: 20 },
    { enabled: !!username }
  );

  const { data: followData } = trpc.follow.check.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: isAuthenticated && !!creator }
  );

  const { data: blockData } = trpc.block.check.useQuery(
    { userId: creator?.userId || 0 },
    { enabled: isAuthenticated && !!creator }
  );

  const blockMutation = trpc.block.toggle.useMutation({
    onSuccess: (result) => {
      utils.block.check.invalidate({ userId: creator?.userId || 0 });
      if (result.blocked) {
        toast.success("ブロックしました");
      } else {
        toast.success("ブロックを解除しました");
      }
    },
    onError: (error) => {
      toast.error(`エラー: ${error.message}`);
    },
  });

  const handleBlockToggle = () => {
    if (!creator) return;
    blockMutation.mutate({ userId: creator.userId });
  };

  const isBlocked = blockData?.blocked || false;

  const { data: plans } = trpc.subscriptionPlan.getByCreatorId.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: !!creator }
  );

  const followMutation = trpc.follow.toggle.useMutation({
    onMutate: async () => {
      if (!creator) return;
      // Cancel any outgoing refetches
      await utils.follow.check.cancel({ creatorId: creator.id });
      await utils.creator.getByUsername.cancel({ username: username || "" });

      // Snapshot the previous values
      const previousFollowData = utils.follow.check.getData({ creatorId: creator.id });
      const previousCreatorData = utils.creator.getByUsername.getData({ username: username || "" });

      // Optimistically update
      if (previousFollowData) {
        utils.follow.check.setData({ creatorId: creator.id }, { following: !previousFollowData.following });
      }
      if (previousCreatorData) {
        utils.creator.getByUsername.setData({ username: username || "" }, {
          ...previousCreatorData,
          followerCount: previousCreatorData.followerCount + (previousFollowData?.following ? -1 : 1),
        });
      }

      return { previousFollowData, previousCreatorData };
    },
    onError: (_err, _variables, context) => {
      if (!creator) return;
      // Rollback on error
      if (context?.previousFollowData) {
        utils.follow.check.setData({ creatorId: creator.id }, context.previousFollowData);
      }
      if (context?.previousCreatorData) {
        utils.creator.getByUsername.setData({ username: username || "" }, context.previousCreatorData);
      }
      toast.error("エラーが発生しました");
    },
    onSuccess: (data) => {
      toast.success(data.following ? "フォローしました" : "フォローを解除しました");
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.follow.check.invalidate({ creatorId: creator?.id || 0 });
      utils.creator.getByUsername.invalidate({ username: username || "" });
    },
  });

  const handleFollowToggle = () => {
    if (!creator) return;
    followMutation.mutate({ creatorId: creator.id });
  };

  const isFollowing = followData?.following || false;

  if (creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 hero-gradient">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <User className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">クリエイターが見つかりません</h1>
          <p className="text-muted-foreground">URLを確認してください</p>
        </div>
        <Link href="/discover">
          <Button size="lg" className="shine-effect">クリエイターを探す</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover Image / Gradient */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        {creator.coverUrl ? (
          <img
            src={creator.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/10 to-[oklch(0.85_0.16_85)]/20" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="container relative">
        <div className="flex flex-col md:flex-row gap-6 -mt-20 md:-mt-24">
          {/* Avatar */}
          <div className="relative z-10">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl border-4 border-background bg-card shadow-xl overflow-hidden">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <User className="h-16 w-16 text-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 pt-4 md:pt-20 space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{creator.displayName}</h1>
                <p className="text-muted-foreground text-lg">@{creator.username}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="border-2">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleCopyTipLink}>
                      {copied ? (
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                      ) : (
                        <LinkIcon className="h-4 w-4 mr-2" />
                      )}
                      チップリンクをコピー
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success("ページリンクをコピーしました");
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      ページリンクをコピー
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {isAuthenticated ? (
                  <>
                    <Button
                      variant={isFollowing ? "secondary" : "outline"}
                      onClick={handleFollowToggle}
                      disabled={followMutation.isPending}
                      className="border-2 font-semibold"
                    >
                      {isFollowing ? "フォロー中" : "フォロー"}
                    </Button>
                    <Button
                      onClick={() => setTipDialogOpen(true)}
                      className="shine-effect gap-2 font-semibold"
                    >
                      <Heart className="h-4 w-4" />
                      応援する
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="border-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={handleBlockToggle}
                          disabled={blockMutation.isPending}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {isBlocked ? "ブロック解除" : "ブロック"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setReportDialogOpen(true)}
                          className="text-destructive"
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          通報する
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <Button className="shine-effect gap-2 font-semibold">
                      <Heart className="h-4 w-4" />
                      応援する
                    </Button>
                  </SignInButton>
                )}
              </div>
            </div>

            {/* Bio */}
            {creator.bio && (
              <p className="text-foreground leading-relaxed max-w-2xl">{creator.bio}</p>
            )}

            {/* Stats & Category */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-semibold text-foreground">{creator.followerCount.toLocaleString()}</span>
                <span>フォロワー</span>
              </div>
              {creator.totalSupport > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">¥{creator.totalSupport.toLocaleString()}</span>
                  <span>総支援額</span>
                </div>
              )}
              {creator.category && (
                <span className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                  {creator.category}
                </span>
              )}
            </div>

            {/* Social Links */}
            {creator.socialLinks && (() => {
              try {
                const links = JSON.parse(creator.socialLinks);
                if (Object.keys(links).length === 0) return null;
                return (
                  <div className="flex items-center gap-2">
                    {links.twitter && (
                      <a
                        href={links.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {links.instagram && (
                      <a
                        href={links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {links.youtube && (
                      <a
                        href={links.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Youtube className="h-5 w-5" />
                      </a>
                    )}
                    {links.website && (
                      <a
                        href={links.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                );
              } catch {
                return null;
              }
            })()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12 space-y-12">
        {/* Subscription Plans */}
        {plans && plans.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[oklch(0.85_0.16_85)]/10">
                <Crown className="h-5 w-5 text-[oklch(0.75_0.14_85)]" />
              </div>
              <h2 className="text-2xl font-bold">月額支援プラン</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => {
                let benefits: string[] = [];
                try {
                  benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
                } catch {
                  benefits = [];
                }
                return (
                  <Card
                    key={plan.id}
                    className="p-6 space-y-4 card-interactive cursor-pointer"
                    onClick={() => setSubscribeDialogOpen(true)}
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">¥{plan.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">/月</p>
                      </div>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                    )}
                    {benefits.length > 0 && (
                      <ul className="space-y-2 text-sm">
                        {benefits.slice(0, 3).map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{benefit}</span>
                          </li>
                        ))}
                        {benefits.length > 3 && (
                          <li className="text-muted-foreground pl-6">
                            +{benefits.length - 3}件の特典
                          </li>
                        )}
                      </ul>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {plan.subscriberCount}人が加入中
                      </p>
                      <Button size="sm" className="font-semibold">
                        加入する
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Posts */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">投稿</h2>
          </div>
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    creator: {
                      id: creator.id,
                      username: creator.username,
                      displayName: creator.displayName,
                      avatarUrl: creator.avatarUrl,
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">まだ投稿がありません</p>
              <p className="text-sm mt-1">最初の投稿を楽しみにお待ちください</p>
            </div>
          )}
        </section>
      </div>

      {/* Dialogs */}
      {isAuthenticated && (
        <>
          <TipDialog
            open={tipDialogOpen}
            onOpenChange={setTipDialogOpen}
            creatorId={creator.id}
            creatorName={creator.displayName}
          />
          {plans && plans.length > 0 && (
            <SubscribeDialog
              open={subscribeDialogOpen}
              onOpenChange={setSubscribeDialogOpen}
              plans={plans}
              creatorId={creator.id}
              creatorName={creator.displayName}
            />
          )}
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            targetType="creator"
            targetId={creator.id}
            targetName={creator.username}
          />
        </>
      )}
    </div>
  );
}
