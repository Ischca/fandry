import { Heart, MessageCircle } from "lucide-react";
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Creator Header */}
        <Link href={`/creator/${post.creator.username}`}>
          <div className="p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors cursor-pointer">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.creator.avatarUrl || undefined} />
              <AvatarFallback>{post.creator.displayName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{post.creator.displayName}</p>
              <p className="text-xs text-muted-foreground">@{post.creator.username}</p>
            </div>
          </div>
        </Link>

        {/* Media */}
        {firstMedia && (
          <div className="relative aspect-square">
            <img
              src={firstMedia}
              alt={post.title || "投稿画像"}
              className={`w-full h-full object-cover ${
                post.type === "paid" || post.type === "membership"
                  ? "blur-md"
                  : ""
              }`}
            />
            {(post.type === "paid" || post.type === "membership") && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-background/90 px-4 py-2 rounded-lg">
                  <p className="text-sm font-semibold">
                    {post.type === "paid" ? `¥${post.price}` : "会員限定"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <Link href={`/post/${post.id}`}>
          <div className="p-4 space-y-2 cursor-pointer hover:bg-accent/30 transition-colors">
            {post.title && (
              <h3 className="font-bold text-lg">{post.title || ""}</h3>
            )}
            <p className="text-sm text-muted-foreground line-clamp-3">
              {post.content}
            </p>
          </div>
        </Link>

        {/* Actions and Timestamp */}
        <div className="px-4 pb-4 space-y-2">

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{post.likeCount}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.commentCount}</span>
            </Button>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
