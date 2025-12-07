import { Lock, Crown, Heart, Eye } from "lucide-react";
import { Link } from "wouter";

interface Post {
  id: number;
  title: string | null;
  content: string;
  type: "free" | "paid" | "membership";
  price?: number | null;
  mediaUrls?: string | null;
  likeCount: number;
  createdAt: Date;
}

interface WorksGalleryProps {
  posts: Post[];
  creatorUsername: string;
}

function WorkCard({ post, index }: { post: Post; index: number }) {
  const mediaUrls = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
  const firstMedia = mediaUrls[0];
  const isPaidContent = post.type === "paid" || post.type === "membership";

  // Varied aspect ratios for visual interest
  const aspectClasses = [
    "aspect-[3/4]",
    "aspect-square",
    "aspect-[4/5]",
    "aspect-[3/4]",
    "aspect-[4/3]",
    "aspect-square",
  ];
  const aspectClass = aspectClasses[index % aspectClasses.length];

  return (
    <Link href={`/post/${post.id}`}>
      <article
        className="group relative overflow-hidden rounded-lg bg-muted/30 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
        style={{
          animationDelay: `${index * 100}ms`,
          animationFillMode: "both",
        }}
      >
        {/* Image */}
        <div className={`relative ${aspectClass} overflow-hidden`}>
          {firstMedia ? (
            <img
              src={firstMedia}
              alt={post.title || ""}
              className={`w-full h-full object-cover transition-all duration-700 ease-out ${
                isPaidContent
                  ? "blur-md scale-105 brightness-50"
                  : "group-hover:scale-105"
              }`}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <span className="text-4xl text-muted-foreground/30 font-serif">
                {post.title?.[0] || "◆"}
              </span>
            </div>
          )}

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 transition-all duration-300 ${
              isPaidContent
                ? "bg-black/40"
                : "bg-black/0 group-hover:bg-black/40"
            }`}
          />

          {/* Paid content lock */}
          {isPaidContent && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                {post.type === "paid" ? (
                  <>
                    <Lock className="h-6 w-6 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-medium">
                      ¥{post.price?.toLocaleString()}
                    </p>
                  </>
                ) : (
                  <>
                    <Crown className="h-6 w-6 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-medium">Members Only</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Hover content (for free posts) */}
          {!isPaidContent && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-4 text-white">
                <div className="flex items-center gap-1.5">
                  <Heart className="h-5 w-5" />
                  <span className="font-medium">{post.likeCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">View</span>
                </div>
              </div>
            </div>
          )}

          {/* Title strip at bottom */}
          {post.title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="text-white font-medium line-clamp-2 text-sm">
                {post.title}
              </h3>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

export function WorksGallery({ posts, creatorUsername: _creatorUsername }: WorksGalleryProps) {
  if (posts.length === 0) {
    return (
      <section className="py-20 md:py-32">
        <div className="container max-w-6xl text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <span className="text-3xl text-muted-foreground/30">◇</span>
            </div>
            <h3 className="text-xl font-serif">No Works Yet</h3>
            <p className="text-muted-foreground">
              このクリエイターはまだ作品を公開していません
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Featured post (first one)
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-6xl">
        {/* Section header */}
        <div className="flex items-end justify-between mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div>
            <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-2">
              Works
            </h2>
            <p className="font-serif text-3xl md:text-4xl font-bold">
              Latest Creations
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {posts.length} works
          </p>
        </div>

        {/* Featured work */}
        <div
          className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "100ms", animationFillMode: "both" }}
        >
          <Link href={`/post/${featuredPost.id}`}>
            <article className="group relative overflow-hidden rounded-xl bg-muted/30 cursor-pointer">
              <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
                {(() => {
                  const mediaUrls = featuredPost.mediaUrls
                    ? JSON.parse(featuredPost.mediaUrls)
                    : [];
                  const firstMedia = mediaUrls[0];
                  const isPaid =
                    featuredPost.type === "paid" ||
                    featuredPost.type === "membership";

                  return (
                    <>
                      {firstMedia ? (
                        <img
                          src={firstMedia}
                          alt={featuredPost.title || ""}
                          className={`w-full h-full object-cover transition-all duration-700 ${
                            isPaid
                              ? "blur-md brightness-50"
                              : "group-hover:scale-[1.02]"
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-neutral-800" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                        {isPaid && (
                          <div className="flex items-center gap-2 text-white/70 text-sm mb-2">
                            {featuredPost.type === "paid" ? (
                              <>
                                <Lock className="h-4 w-4" />
                                <span>¥{featuredPost.price?.toLocaleString()}</span>
                              </>
                            ) : (
                              <>
                                <Crown className="h-4 w-4" />
                                <span>Members Only</span>
                              </>
                            )}
                          </div>
                        )}
                        <h3 className="font-serif text-2xl md:text-4xl font-bold text-white max-w-xl leading-tight">
                          {featuredPost.title || "Untitled Work"}
                        </h3>
                        <p className="text-white/60 mt-2 line-clamp-2 max-w-lg">
                          {featuredPost.content}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </article>
          </Link>
        </div>

        {/* Grid of remaining works */}
        {remainingPosts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {remainingPosts.map((post, index) => (
              <WorkCard key={post.id} post={post} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
