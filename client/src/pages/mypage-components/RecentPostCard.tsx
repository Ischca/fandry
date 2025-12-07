import { Heart, Eye, Calendar, FileText } from "lucide-react";
import { Link } from "wouter";

interface Post {
  id: number;
  title: string | null;
  content: string;
  type: string;
  createdAt: Date | string;
  mediaUrls?: string | null;
  likeCount: number;
  viewCount: number;
}

interface RecentPostCardProps {
  post: Post;
}

export function RecentPostCard({ post }: RecentPostCardProps) {
  const hasMedia = post.mediaUrls && JSON.parse(post.mediaUrls).length > 0;
  const firstMedia = hasMedia ? JSON.parse(post.mediaUrls!)[0] : null;
  const isImage = firstMedia && !firstMedia.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <Link href={`/edit-post/${post.id}`}>
      <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-lg cursor-pointer">
        {/* Media Preview */}
        <div className="aspect-[16/9] bg-muted/50 overflow-hidden">
          {isImage ? (
            <img
              src={firstMedia}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <FileText className="h-12 w-12 text-primary/30" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md ${
                post.type === "free"
                  ? "bg-green-500/20 text-green-700"
                  : post.type === "paid"
                    ? "bg-amber-500/20 text-amber-700"
                    : "bg-violet-500/20 text-violet-700"
              }`}
            >
              {post.type === "free"
                ? "無料"
                : post.type === "paid"
                  ? "有料"
                  : "会員限定"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {post.title || post.content.substring(0, 40)}
          </h4>

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {post.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(post.createdAt).toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
