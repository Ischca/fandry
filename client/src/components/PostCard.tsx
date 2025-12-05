import { Heart, MessageCircle, Lock, Crown } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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

export function PostCard({ post }: PostCardProps) {
  const mediaUrls = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
  const firstMedia = mediaUrls[0];

  const isPaidContent = post.type === "paid" || post.type === "membership";

  return (
    <Card className="overflow-hidden group card-interactive p-0 gap-0">
      <CardContent className="p-0">
        {/* Creator Header */}
        <Link href={`/creator/${post.creator.username}`}>
          <div className="p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer">
            <Avatar className="h-10 w-10 ring-2 ring-border/50">
              <AvatarImage src={post.creator.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {post.creator.displayName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{post.creator.displayName}</p>
              <p className="text-xs text-muted-foreground">@{post.creator.username}</p>
            </div>
            {/* Post type badge */}
            {post.type !== "free" && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                post.type === "paid"
                  ? "bg-primary/10 text-primary"
                  : "bg-[oklch(0.85_0.16_85)]/10 text-[oklch(0.65_0.14_85)]"
              }`}>
                {post.type === "paid" ? (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>¥{post.price}</span>
                  </>
                ) : (
                  <>
                    <Crown className="h-3 w-3" />
                    <span>会員限定</span>
                  </>
                )}
              </div>
            )}
          </div>
        </Link>

        {/* Media */}
        {firstMedia && (
          <Link href={`/post/${post.id}`}>
            <div className="relative aspect-[4/3] cursor-pointer overflow-hidden">
              <img
                src={firstMedia}
                alt={post.title || "投稿画像"}
                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                  isPaidContent ? "blur-lg scale-110" : ""
                }`}
              />
              {isPaidContent && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/30 to-transparent">
                  <div className="glass-card px-6 py-4 rounded-xl text-center">
                    {post.type === "paid" ? (
                      <>
                        <Lock className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="font-bold text-lg">¥{post.price?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">購入して閲覧</p>
                      </>
                    ) : (
                      <>
                        <Crown className="h-6 w-6 mx-auto mb-2 text-[oklch(0.85_0.16_85)]" />
                        <p className="font-bold">会員限定コンテンツ</p>
                        <p className="text-xs text-muted-foreground mt-1">メンバーシップに加入</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Content */}
        <Link href={`/post/${post.id}`}>
          <div className="p-4 space-y-2 cursor-pointer hover:bg-secondary/30 transition-colors">
            {post.title && (
              <h3 className="font-bold text-lg leading-tight line-clamp-2">{post.title}</h3>
            )}
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {post.content}
            </p>
          </div>
        </Link>

        {/* Actions and Timestamp */}
        <div className="px-4 pb-4 space-y-3">
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 group/btn"
            >
              <Heart className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
              <span className="text-sm font-medium">{post.likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{post.commentCount}</span>
            </Button>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "short",
              day: "numeric"
            })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
