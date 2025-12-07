import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Lock,
  Crown,
  MessageCircle,
  MoreHorizontal,
  Flag,
  ArrowLeft,
  Share2,
  Bookmark,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatRelativeTime,
  CommentSection,
  LockedContent,
} from "./postdetail-components";

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const postId = parseInt(id || "0");
  const utils = trpc.useUtils();

  const { data: post, isLoading } = trpc.post.getById.useQuery(
    { id: postId },
    { enabled: postId > 0 }
  );

  const { data: likeData } = trpc.like.check.useQuery(
    { postId },
    { enabled: isAuthenticated && postId > 0 }
  );

  const { data: plans } = trpc.subscriptionPlan.getByCreatorId.useQuery(
    { creatorId: post?.creatorId || 0 },
    { enabled: post?.type === "membership" && !!post?.creatorId }
  );

  const likeMutation = trpc.like.toggle.useMutation({
    onMutate: async () => {
      await utils.like.check.cancel({ postId });
      await utils.post.getById.cancel({ id: postId });
      const previousLikeData = utils.like.check.getData({ postId });
      const previousPostData = utils.post.getById.getData({ id: postId });
      if (previousLikeData) {
        utils.like.check.setData(
          { postId },
          { liked: !previousLikeData.liked }
        );
      }
      if (previousPostData) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...previousPostData,
            likeCount:
              previousPostData.likeCount + (previousLikeData?.liked ? -1 : 1),
          }
        );
      }
      return { previousLikeData, previousPostData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLikeData) {
        utils.like.check.setData({ postId }, context.previousLikeData);
      }
      if (context?.previousPostData) {
        utils.post.getById.setData({ id: postId }, context.previousPostData);
      }
      toast.error("エラーが発生しました");
    },
    onSettled: () => {
      utils.like.check.invalidate({ postId });
      utils.post.getById.invalidate({ id: postId });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("いいねするにはログインが必要です");
      return;
    }
    likeMutation.mutate({ postId });
  };

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handlePurchaseSuccess = () => {
    utils.post.getById.invalidate({ id: postId });
  };

  const handleSubscribeSuccess = () => {
    utils.post.getById.invalidate({ id: postId });
  };

  const isLiked = likeData?.liked || false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
            <Heart className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              投稿が見つかりません
            </h2>
            <p className="text-muted-foreground">
              削除されたか、URLが間違っている可能性があります
            </p>
          </div>
          <Link href="/feed">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              フィードに戻る
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container max-w-4xl flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/creator/${post.creatorUsername}`}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted/80"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link
              href={`/creator/${post.creatorUsername}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src={
                  post.creatorAvatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.creatorUsername}`
                }
                alt=""
                className="w-8 h-8 rounded-full ring-2 ring-background shadow-sm"
              />
              <span className="font-medium text-sm hidden sm:inline">
                {post.creatorDisplayName}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem
                  onClick={() => setReportDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  通報する
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl py-6 sm:py-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <article className="space-y-8">
          {/* Post Header */}
          <header className="space-y-4">
            {/* Creator Info - Mobile */}
            <Link
              href={`/creator/${post.creatorUsername}`}
              className="sm:hidden"
            >
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <img
                    src={
                      post.creatorAvatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.creatorUsername}`
                    }
                    alt=""
                    className="w-11 h-11 rounded-full ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {post.creatorDisplayName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{post.creatorUsername}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(new Date(post.createdAt))}
                </span>
              </div>
            </Link>

            {/* Title */}
            {post.title && (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                {post.title}
              </h1>
            )}

            {/* Meta - Desktop */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <Link
                href={`/creator/${post.creatorUsername}`}
                className="hover:text-foreground transition-colors"
              >
                {post.creatorDisplayName}
              </Link>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
              <time>{formatRelativeTime(new Date(post.createdAt))}</time>
              {post.type !== "free" && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                  {post.type === "paid" ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-500 font-medium">
                      <Lock className="h-3.5 w-3.5" />¥
                      {post.price?.toLocaleString()}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-400 font-medium">
                      <Crown className="h-3.5 w-3.5" />
                      会員限定
                    </span>
                  )}
                </>
              )}
            </div>
          </header>

          {/* Media Section */}
          {post.hasAccess &&
            post.mediaUrls &&
            (() => {
              const mediaUrls = JSON.parse(post.mediaUrls);
              if (mediaUrls.length === 0) return null;

              return (
                <div className="space-y-3 -mx-4 sm:mx-0">
                  {mediaUrls.map((url: string, index: number) => {
                    const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);

                    if (isVideo) {
                      return (
                        <div
                          key={index}
                          className="relative bg-black sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/10"
                        >
                          <video controls className="w-full" src={url}>
                            お使いのブラウザは動画再生に対応していません。
                          </video>
                        </div>
                      );
                    } else {
                      return (
                        <figure key={index} className="relative group">
                          <div className="overflow-hidden sm:rounded-2xl bg-muted/30 shadow-xl shadow-black/5">
                            <img
                              src={url}
                              alt={`${post.title || "投稿"} - 画像 ${index + 1}`}
                              className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                              style={{ maxHeight: "80vh" }}
                            />
                          </div>
                          {mediaUrls.length > 1 && (
                            <figcaption className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                              {index + 1} / {mediaUrls.length}
                            </figcaption>
                          )}
                        </figure>
                      );
                    }
                  })}
                </div>
              );
            })()}

          {/* Locked Content Preview */}
          {!post.hasAccess && post.type !== "free" && (
            <LockedContent
              type={post.type as "paid" | "membership"}
              price={post.price || undefined}
              creatorDisplayName={post.creatorDisplayName || "クリエイター"}
              membershipTier={post.membershipTier || undefined}
              plans={plans}
              onPurchase={() => setPurchaseDialogOpen(true)}
              onSubscribe={() => setSubscribeDialogOpen(true)}
            />
          )}

          {/* Post Content */}
          {post.hasAccess && (
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] sm:prose-p:text-base">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          )}

          {/* Floating Action Bar */}
          <div className="sticky bottom-4 z-40 flex justify-center">
            <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-card/95 backdrop-blur-xl border shadow-lg shadow-black/5">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`rounded-full gap-2 px-4 transition-all ${
                  isLiked
                    ? "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart
                  className={`h-4 w-4 transition-transform ${isLiked ? "fill-current scale-110" : ""}`}
                />
                <span className="font-medium">{post.likeCount}</span>
              </Button>

              <div className="w-px h-5 bg-border" />

              <Button
                variant="ghost"
                size="sm"
                className="rounded-full gap-2 px-4 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  document
                    .getElementById("comments")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">{post.commentCount}</span>
              </Button>

              <div className="w-px h-5 bg-border" />

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection postId={postId} commentCount={post.commentCount} />
        </article>
      </main>

      {/* Purchase Dialog */}
      {post && post.type === "paid" && (
        <PurchaseDialog
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          postId={post.id}
          postTitle={post.title}
          price={post.price || 0}
          creatorName={post.creatorDisplayName || "クリエイター"}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Subscribe Dialog */}
      {post && post.type === "membership" && plans && (
        <SubscribeDialog
          open={subscribeDialogOpen}
          onOpenChange={setSubscribeDialogOpen}
          plans={plans}
          creatorId={post.creatorId}
          creatorName={post.creatorDisplayName || "クリエイター"}
          requiredTier={post.membershipTier || undefined}
          onSuccess={handleSubscribeSuccess}
        />
      )}

      {/* Report Dialog */}
      {post && (
        <ReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          targetType="post"
          targetId={post.id}
        />
      )}
    </div>
  );
}
