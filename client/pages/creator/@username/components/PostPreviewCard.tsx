import { Link } from "wouter";
import {
  Heart,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Eye,
  Calendar,
} from "lucide-react";
import { formatRelativeTime } from "./utils";

interface Post {
  id: number;
  title: string | null;
  content: string;
  type: string;
  price: number | null;
  mediaUrls: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date | string;
}

interface Creator {
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

interface PostPreviewCardProps {
  post: Post;
  creator: Creator;
}

export function PostPreviewCard({ post }: PostPreviewCardProps) {
  const hasMedia =
    post.mediaUrls &&
    (() => {
      try {
        return JSON.parse(post.mediaUrls).length > 0;
      } catch {
        return false;
      }
    })();
  const firstMedia = hasMedia
    ? (() => {
        try {
          return JSON.parse(post.mediaUrls!)[0];
        } catch {
          return null;
        }
      })()
    : null;
  const isImage = firstMedia && !firstMedia.match(/\.(mp4|webm|ogg|mov)$/i);

  const typeConfig = {
    free: { label: "無料", bg: "bg-emerald-500/90", text: "text-white" },
    paid: {
      label: `¥${post.price?.toLocaleString()}`,
      bg: "bg-amber-500/90",
      text: "text-white",
    },
    membership: {
      label: "メンバー限定",
      bg: "bg-violet-500/90",
      text: "text-white",
    },
  };
  const config =
    typeConfig[post.type as keyof typeof typeConfig] || typeConfig.free;

  return (
    <Link href={`/post/${post.id}`}>
      <article className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 cursor-pointer">
        {/* Media / Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {isImage ? (
            <>
              <img
                src={firstMedia}
                alt={post.title || ""}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary/40" />
              </div>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} backdrop-blur-sm shadow-lg`}
            >
              {config.label}
            </span>
          </div>

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs">
              <Heart className="h-3 w-3" />
              {post.likeCount}
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs">
              <MessageCircle className="h-3 w-3" />
              {post.commentCount}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {post.title || post.content.substring(0, 60)}
          </h3>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatRelativeTime(new Date(post.createdAt))}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {post.viewCount} views
            </span>
          </div>
        </div>

        {/* Hover Arrow */}
        <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <ArrowRight className="h-4 w-4 text-white" />
        </div>
      </article>
    </Link>
  );
}
