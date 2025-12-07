import { Pin, ImageIcon, Lock, Eye } from "lucide-react";
import { Link } from "wouter";

interface Post {
  id: number;
  title: string | null;
  content: string;
  type: "free" | "paid" | "membership";
  price: number | null;
  mediaUrls: string | null;
  likeCount: number;
  viewCount: number;
}

interface FeaturedPostsProps {
  featuredPostIds: string | null;
  posts: Post[];
  creatorUsername: string;
}

export function FeaturedPosts({
  featuredPostIds,
  posts,
  creatorUsername,
}: FeaturedPostsProps) {
  // Parse featured post IDs
  let parsedIds: number[] = [];
  try {
    parsedIds = featuredPostIds ? JSON.parse(featuredPostIds) : [];
  } catch {
    // Invalid JSON
  }

  if (parsedIds.length === 0) return null;

  // Get featured posts in order
  const featuredPosts = parsedIds
    .map(id => posts.find(p => p.id === id))
    .filter((p): p is Post => p !== undefined);

  if (featuredPosts.length === 0) return null;

  // Parse media URLs helper
  const getFirstMedia = (mediaUrls: string | null): string | null => {
    if (!mediaUrls) return null;
    try {
      const urls = JSON.parse(mediaUrls);
      return Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
    } catch {
      return null;
    }
  };

  return (
    <section className="py-6">
      <div className="container max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Pin className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">ピックアップ</h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {featuredPosts.map((post, index) => {
            const mediaUrl = getFirstMedia(post.mediaUrls);
            const isPaid = post.type === "paid" || post.type === "membership";

            return (
              <Link
                key={post.id}
                href={`/creator/${creatorUsername}/post/${post.id}`}
                className="group animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: "both",
                }}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-card shadow-sm">
                  {mediaUrl ? (
                    <img
                      src={mediaUrl}
                      alt={post.title || "投稿"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Pin badge */}
                  <div className="absolute top-2 left-2">
                    <div className="p-1 bg-primary/90 rounded-full">
                      <Pin className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>

                  {/* Paid indicator */}
                  {isPaid && (
                    <div className="absolute top-2 right-2">
                      <div className="p-1 bg-black/50 rounded-full">
                        <Lock className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Title and stats */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate mb-1">
                      {post.title || "無題"}
                    </p>
                    <div className="flex items-center gap-2 text-white/70 text-xs">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.viewCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
