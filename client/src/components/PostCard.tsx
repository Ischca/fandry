import { Heart, MessageCircle, Lock, Crown, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useState } from "react";

interface PostCardProps {
  post: {
    id: number;
    title: string | null;
    content: string;
    type: "free" | "paid" | "membership";
    price?: number | null;
    mediaUrls?: string | null;
    likeCount: number;
    commentCount: number;
    createdAt: Date;
    creator: {
      id: number;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
    };
  };
}

// Relative time formatting
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
};

export function PostCard({ post }: PostCardProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const mediaUrls = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
  const firstMedia = mediaUrls[0];
  const mediaCount = mediaUrls.length;

  const isPaidContent = post.type === "paid" || post.type === "membership";

  // Local optimistic state for immediate UI feedback
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState<number | null>(null);

  // Query the like status
  const { data: likeData } = trpc.like.check.useQuery(
    { postId: post.id },
    { enabled: isAuthenticated }
  );

  const likeMutation = trpc.like.toggle.useMutation({
    onMutate: async () => {
      const currentLiked = optimisticLiked ?? likeData?.liked ?? false;
      const currentCount = optimisticLikeCount ?? post.likeCount;

      // Set optimistic state immediately
      setOptimisticLiked(!currentLiked);
      setOptimisticLikeCount(currentCount + (currentLiked ? -1 : 1));

      return { previousLiked: currentLiked, previousCount: currentCount };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context) {
        setOptimisticLiked(context.previousLiked);
        setOptimisticLikeCount(context.previousCount);
      }
      toast.error("エラーが発生しました");
    },
    onSettled: () => {
      // Reset optimistic state and refetch
      setOptimisticLiked(null);
      setOptimisticLikeCount(null);
      utils.like.check.invalidate({ postId: post.id });
      utils.feed.getFollowingPosts.invalidate();
      utils.post.getByCreatorUsername.invalidate();
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("いいねするにはログインが必要です");
      return;
    }

    likeMutation.mutate({ postId: post.id });
  };

  // Use optimistic state if available, otherwise use server data
  const isLiked = optimisticLiked ?? likeData?.liked ?? false;
  const displayLikeCount = optimisticLikeCount ?? post.likeCount;

  return (
    <article className="relative bg-card rounded-2xl overflow-hidden border border-border/40 hover:border-border/60 transition-colors duration-300">
      {/* Creator Header - separate hover group */}
      <Link href={`/creator/${post.creator.username}`}>
        <header className="group/creator relative p-4 pb-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors duration-200">
          {/* Avatar with ring effect on hover */}
          <Avatar className="h-11 w-11 ring-2 ring-background shadow-md transition-all duration-300 group-hover/creator:ring-primary/50 group-hover/creator:scale-105">
            <AvatarImage src={post.creator.avatarUrl || undefined} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
              {post.creator.displayName[0]}
            </AvatarFallback>
          </Avatar>

          {/* Creator info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] truncate tracking-tight group-hover/creator:text-primary transition-colors duration-200">
              {post.creator.displayName}
            </p>
            <p className="text-xs text-muted-foreground/70">
              @{post.creator.username} · {formatRelativeTime(new Date(post.createdAt))}
            </p>
          </div>

          {/* Post type badge */}
          {post.type !== "free" && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                post.type === "paid"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-1 ring-amber-500/20"
                  : "bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/20"
              }`}
            >
              {post.type === "paid" ? (
                <>
                  <Lock className="h-3 w-3" />
                  <span>¥{post.price?.toLocaleString()}</span>
                </>
              ) : (
                <>
                  <Crown className="h-3 w-3" />
                  <span>会員</span>
                </>
              )}
            </div>
          )}

          {/* Hover indicator arrow */}
          <div className="opacity-0 group-hover/creator:opacity-100 transition-opacity duration-200 text-muted-foreground">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </header>
      </Link>

      {/* Post content area - separate hover group */}
      <div className="group/post">
        {/* Media Section */}
        {firstMedia && (
          <Link href={`/post/${post.id}`}>
            <div className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted/30">
              {/* Main image */}
              <img
                src={firstMedia}
                alt={post.title || "投稿画像"}
                className={`w-full h-full object-cover transition-all duration-700 ease-out ${
                  isPaidContent
                    ? "blur-xl scale-110 brightness-75"
                    : "group-hover/post:scale-[1.03]"
                }`}
              />

              {/* Media count badge */}
              {mediaCount > 1 && !isPaidContent && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium">
                  +{mediaCount - 1}
                </div>
              )}

              {/* Hover overlay for post link */}
              {!isPaidContent && (
                <div className="absolute inset-0 bg-black/0 group-hover/post:bg-black/10 transition-colors duration-300" />
              )}

              {/* Locked content overlay */}
              {isPaidContent && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Gradient backdrop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

                  {/* Lock card */}
                  <div className="relative z-10 text-center px-8 py-6">
                    <div
                      className={`inline-flex p-3 rounded-2xl mb-3 ${
                        post.type === "paid"
                          ? "bg-amber-500/20 backdrop-blur-sm"
                          : "bg-violet-500/20 backdrop-blur-sm"
                      }`}
                    >
                      {post.type === "paid" ? (
                        <Lock className="h-6 w-6 text-amber-400" />
                      ) : (
                        <Crown className="h-6 w-6 text-violet-400" />
                      )}
                    </div>
                    <p className="text-white font-bold text-lg mb-1">
                      {post.type === "paid"
                        ? `¥${post.price?.toLocaleString()}`
                        : "会員限定"}
                    </p>
                    <p className="text-white/70 text-sm">
                      {post.type === "paid" ? "購入して閲覧" : "メンバーシップに加入"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Content Section */}
        <Link href={`/post/${post.id}`}>
          <div className="p-4 pt-3 cursor-pointer hover:bg-muted/30 transition-colors duration-200">
            {post.title && (
              <h3 className="font-bold text-[17px] leading-snug line-clamp-2 mb-1.5 tracking-tight group-hover/post:text-primary/90 transition-colors duration-200">
                {post.title}
              </h3>
            )}
            <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {post.content}
            </p>
          </div>
        </Link>
      </div>

      {/* Actions Footer */}
      <footer className="px-4 pb-4 pt-1">
        <div className="flex items-center gap-1">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 group/like ${
              isLiked
                ? "text-rose-500 bg-rose-500/10"
                : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
            }`}
          >
            <Heart
              className={`h-[18px] w-[18px] transition-transform duration-200 group-hover/like:scale-110 ${
                isLiked ? "fill-current" : ""
              }`}
            />
            <span className="text-sm font-medium tabular-nums">{displayLikeCount}</span>
          </button>

          {/* Comment button */}
          <Link href={`/post/${post.id}#comments`}>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-all duration-200 group/comment"
            >
              <MessageCircle className="h-[18px] w-[18px] transition-transform duration-200 group-hover/comment:scale-110" />
              <span className="text-sm font-medium tabular-nums">{post.commentCount}</span>
            </button>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Premium indicator for free posts with high engagement */}
          {post.type === "free" && displayLikeCount >= 10 && (
            <div className="flex items-center gap-1 text-xs text-amber-500/80">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="font-medium">人気</span>
            </div>
          )}
        </div>
      </footer>
    </article>
  );
}
