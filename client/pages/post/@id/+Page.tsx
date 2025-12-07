import { useData } from "vike-react/useData";
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
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostPageData } from "./+data";
import {
  formatRelativeTime,
  ClientOnlySection,
  PostActions,
  CommentsSection,
} from "./components";

export default function PostDetail() {
  const { post, plans } = useData<PostPageData>();

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
                <DropdownMenuItem className="text-destructive focus:text-destructive">
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
            <Link href={`/creator/${post.creatorUsername}`} className="sm:hidden">
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

          {/* Media Section - only for free content in SSR */}
          {post.type === "free" &&
            post.mediaUrls &&
            (() => {
              try {
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
              } catch {
                return null;
              }
            })()}

          {/* Locked Content Preview */}
          {post.type !== "free" && (
            <div className="relative -mx-4 sm:mx-0">
              <div className="absolute inset-0 sm:rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 z-10" />
                <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted/30 blur-sm" />
              </div>

              <div className="relative z-20 py-16 sm:py-24 px-6">
                <div className="max-w-md mx-auto text-center space-y-6">
                  <div
                    className={`inline-flex p-4 rounded-2xl ${post.type === "paid" ? "bg-amber-500/10" : "bg-violet-500/10"}`}
                  >
                    {post.type === "paid" ? (
                      <Lock className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                    ) : (
                      <Crown className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {post.type === "paid"
                        ? "有料コンテンツ"
                        : "会員限定コンテンツ"}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {post.type === "paid"
                        ? `このコンテンツを閲覧するには ¥${post.price?.toLocaleString()} でご購入ください`
                        : `${post.creatorDisplayName}のメンバーシップに加入すると閲覧できます`}
                    </p>
                  </div>

                  {/* Plans for membership */}
                  {post.type === "membership" &&
                    plans &&
                    plans.length > 0 &&
                    (() => {
                      const requiredPlans = plans.filter(
                        p => p.tier >= (post.membershipTier || 1)
                      );
                      if (requiredPlans.length > 0) {
                        return (
                          <div className="space-y-2 text-left">
                            {requiredPlans.slice(0, 2).map(plan => (
                              <div
                                key={plan.id}
                                className="flex items-center justify-between p-3 rounded-xl border bg-card/50 backdrop-blur-sm"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-medium text-sm">
                                    {plan.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {plan.subscriberCount}人が加入中
                                  </p>
                                </div>
                                <p className="font-bold">
                                  ¥{plan.price.toLocaleString()}
                                  <span className="text-xs font-normal text-muted-foreground">
                                    /月
                                  </span>
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    })()}
                </div>
              </div>
            </div>
          )}

          {/* Post Content - only for free content in SSR */}
          {post.type === "free" && (
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-[15px] sm:prose-p:text-base">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          )}

          {/* Client-only actions */}
          <ClientOnlySection
            fallback={
              <div className="sticky bottom-4 z-40 flex justify-center">
                <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-card/95 backdrop-blur-xl border shadow-lg shadow-black/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full gap-2 px-4 text-muted-foreground"
                  >
                    <Heart className="h-4 w-4" />
                    <span className="font-medium">{post.likeCount}</span>
                  </Button>
                  <div className="w-px h-5 bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full gap-2 px-4 text-muted-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="font-medium">{post.commentCount}</span>
                  </Button>
                  <div className="w-px h-5 bg-border" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            }
          >
            <PostActions post={post} plans={plans} />
          </ClientOnlySection>

          {/* Divider */}
          <div className="relative py-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
          </div>

          {/* Comments Section - Client only */}
          <ClientOnlySection
            fallback={
              <section id="comments" className="space-y-6 scroll-mt-20">
                <header>
                  <h2 className="text-lg font-semibold tracking-tight">
                    コメント
                  </h2>
                </header>
                <div className="text-center py-12">
                  <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">読み込み中...</p>
                </div>
              </section>
            }
          >
            <CommentsSection postId={post.id} />
          </ClientOnlySection>
        </article>
      </main>
    </div>
  );
}
