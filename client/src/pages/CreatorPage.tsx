import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Share2, User, Twitter, Instagram, Youtube, Globe, MoreHorizontal, Flag, Ban, Copy, Check, Link as LinkIcon } from "lucide-react";
import { useParams, Link } from "wouter";
import { getLoginUrl } from "@/const";
import { TipDialog } from "@/components/TipDialog";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { PostCard } from "@/components/PostCard";
import { ReportDialog } from "@/components/ReportDialog";
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

  // ブロック状態を取得（creatorのuserIdを使う）
  const { data: blockData } = trpc.block.check.useQuery(
    { userId: creator?.userId || 0 },
    { enabled: isAuthenticated && !!creator }
  );

  const blockMutation = trpc.block.toggle.useMutation({
    onSuccess: (result) => {
      trpc.useUtils().block.check.invalidate({ userId: creator?.userId || 0 });
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

  const { data: plans, isLoading: plansLoading } = trpc.subscriptionPlan.getByCreatorId.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: !!creator }
  );

  const followMutation = trpc.follow.toggle.useMutation({
    onSuccess: () => {
      // Refetch follow status
      trpc.useUtils().follow.check.invalidate({ creatorId: creator?.id || 0 });
      // Refetch creator data to update follower count
      trpc.useUtils().creator.getByUsername.invalidate({ username: username || "" });
    },
  });

  const handleFollowToggle = () => {
    if (!creator) return;
    followMutation.mutate({ creatorId: creator.id });
  };

  const isFollowing = followData?.following || false;

  if (creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">クリエイターが見つかりません</h1>
        <Link href="/discover">
          <Button>クリエイターを探す</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/feed">
                  <Button variant="ghost">フィード</Button>
                </Link>
                <Link href="/my">
                  <Button variant="ghost">マイページ</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">ログイン</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {creator.coverUrl && (
        <div className="w-full h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/20">
          <img src={creator.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative -mt-16 md:-mt-20">
            <div className="w-32 h-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{creator.displayName}</h1>
              <p className="text-muted-foreground">@{creator.username}</p>
            </div>
            {creator.bio && <p className="text-foreground">{creator.bio}</p>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{creator.followerCount} フォロワー</span>
              {creator.category && <span className="px-3 py-1 rounded-full bg-accent/20">{creator.category}</span>}
            </div>
            {creator.socialLinks && (() => {
              try {
                const links = JSON.parse(creator.socialLinks);
                if (Object.keys(links).length === 0) return null;
                return (
                  <div className="flex items-center gap-3">
                    {links.twitter && (
                      <a href={links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {links.instagram && (
                      <a href={links.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {links.youtube && (
                      <a href={links.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <Youtube className="h-5 w-5" />
                      </a>
                    )}
                    {links.website && (
                      <a href={links.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
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

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                  variant={isFollowing ? "default" : "outline"}
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending}
                >
                  {isFollowing ? "フォロー中" : "フォロー"}
                </Button>
                <Button className="gap-2" onClick={() => setTipDialogOpen(true)}>
                  <Heart className="h-4 w-4" />
                  応援する
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
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
              <a href={getLoginUrl()}>
                <Button className="gap-2">
                  <Heart className="h-4 w-4" />
                  応援する
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-12">
        {/* 月額支援プラン */}
        {plans && plans.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold">月額支援プラン</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {plans.map((plan) => {
                let benefits: string[] = [];
                try {
                  benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
                } catch {
                  benefits = [];
                }
                return (
                  <Card key={plan.id} className="p-4 space-y-3 hover:shadow-md transition-shadow">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-bold">{plan.name}</h3>
                      <p className="text-lg font-bold">￥{plan.price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/月</span></p>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                    )}
                    {benefits.length > 0 && (
                      <ul className="space-y-1 text-xs">
                        {benefits.slice(0, 3).map((benefit, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5 text-xs">✓</span>
                            <span className="line-clamp-1">{benefit}</span>
                          </li>
                        ))}
                        {benefits.length > 3 && (
                          <li className="text-muted-foreground">+{benefits.length - 3}件の特典</li>
                        )}
                      </ul>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-muted-foreground">
                        {plan.subscriberCount}人が加入中
                      </p>
                      <Button size="sm" onClick={() => setSubscribeDialogOpen(true)}>
                        加入
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div>
        <h2 className="text-2xl font-bold mb-6">投稿</h2>
        {postsLoading ? (
          <p className="text-muted-foreground">読み込み中...</p>
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
          <p className="text-muted-foreground">まだ投稿がありません</p>
        )}
        </div>
      </div>
      
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
