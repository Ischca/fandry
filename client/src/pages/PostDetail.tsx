import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, Lock, Crown, MessageCircle, Send, MoreHorizontal, Flag } from "lucide-react";
import { Link, useParams } from "wouter";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { ReportDialog } from "@/components/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const postId = parseInt(id || "0");

  const { data: post, isLoading } = trpc.post.getById.useQuery(
    { id: postId },
    { enabled: postId > 0 }
  );

  const { data: likeData } = trpc.like.check.useQuery(
    { postId },
    { enabled: isAuthenticated && postId > 0 }
  );

  // 会員限定投稿の場合、クリエイターのプランを取得
  const { data: plans } = trpc.subscriptionPlan.getByCreatorId.useQuery(
    { creatorId: post?.creatorId || 0 },
    { enabled: post?.type === "membership" && !!post?.creatorId }
  );

  // コメント取得
  const { data: comments, refetch: refetchComments } = trpc.comment.getByPostId.useQuery(
    { postId },
    { enabled: postId > 0 }
  );

  // コメント投稿
  const [commentContent, setCommentContent] = React.useState("");
  const commentMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      setCommentContent("");
      refetchComments();
    },
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    commentMutation.mutate({ postId, content: commentContent });
  };

  const likeMutation = trpc.like.toggle.useMutation({
    onSuccess: () => {
      // Refetch like status and post data (to update like count)
      trpc.useUtils().like.check.invalidate({ postId });
      trpc.useUtils().post.getById.invalidate({ id: postId });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      alert("いいねするにはログインが必要です。");
      return;
    }
    likeMutation.mutate({ postId });
  };

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handlePurchase = () => {
    setPurchaseDialogOpen(true);
  };

  const handleSubscribe = () => {
    setSubscribeDialogOpen(true);
  };

  const handlePurchaseSuccess = () => {
    // Refresh post data to update access
    trpc.useUtils().post.getById.invalidate({ id: postId });
  };

  const handleSubscribeSuccess = () => {
    // Refresh post data to update access
    trpc.useUtils().post.getById.invalidate({ id: postId });
  };

  const isLiked = likeData?.liked || false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">投稿が見つかりません</h2>
          <Link href="/feed">
            <Button>フィードに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/feed">
              <Button variant="ghost">フィード</Button>
            </Link>
            <Link href="/discover">
              <Button variant="ghost">発見</Button>
            </Link>
            {isAuthenticated && (
              <Link href="/my">
                <Button variant="default">マイページ</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-3xl py-8">
        <Card className="p-6 space-y-6">
          {/* クリエイター情報 */}
          <Link href={`/creator/${post.creatorUsername}`}>
            <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img
                src={post.creatorAvatarUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                alt={post.creatorDisplayName || ""}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="font-semibold">{post.creatorDisplayName}</div>
                <div className="text-sm text-muted-foreground">@{post.creatorUsername}</div>
              </div>
            </div>
          </Link>

          {/* 投稿タイトル */}
          {post.title && (
            <h1 className="text-2xl font-bold">{post.title}</h1>
          )}

          {/* メディア表示 */}
          {post.hasAccess && post.mediaUrls && (() => {
            const mediaUrls = JSON.parse(post.mediaUrls);
            if (mediaUrls.length === 0) return null;
            
            return (
              <div className="space-y-4">
                {mediaUrls.map((url: string, index: number) => {
                  // 画像か動画かを判定（簡易的な判定）
                  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
                  
                  if (isVideo) {
                    return (
                      <video
                        key={index}
                        controls
                        className="w-full rounded-lg"
                        src={url}
                      >
                        お使いのブラウザは動画再生に対応していません。
                      </video>
                    );
                  } else {
                    return (
                      <img
                        key={index}
                        src={url}
                        alt={`${post.title || "投稿"} - 画像 ${index + 1}`}
                        className="w-full rounded-lg"
                      />
                    );
                  }
                })}
              </div>
            );
          })()}

          {/* 投稿タイプバッジ */}
          {post.type === "paid" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium">
              <Lock className="h-4 w-4" />
              <span>有料 ¥{post.price?.toLocaleString()}</span>
            </div>
          )}
          {post.type === "membership" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-sm font-medium">
              <Crown className="h-4 w-4" />
              <span>会員限定</span>
            </div>
          )}

          {/* 投稿本文 */}
          {post.hasAccess ? (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* プレビュー（最初の100文字） */}
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {post.content.substring(0, 100)}...
                </p>
              </div>

              {/* アクセス制限メッセージ */}
              <Card className="p-8 text-center space-y-4 bg-muted/50">
                {post.type === "paid" ? (
                  <>
                    <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-semibold">この投稿は有料コンテンツです</h3>
                    <p className="text-muted-foreground">
                      ¥{post.price?.toLocaleString()}で購入すると、全文を閲覧できます。
                    </p>
                    {isAuthenticated ? (
                      <Button size="lg" onClick={handlePurchase}>
                        ¥{post.price?.toLocaleString()}で購入する
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          購入するにはログインが必要です
                        </p>
                        <Button size="lg" asChild>
                          <a href={`/api/oauth/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                            ログインして購入
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Crown className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-semibold">この投稿は会員限定です</h3>
                    <p className="text-muted-foreground">
                      {post.creatorDisplayName}の月額支援プランに加入すると閲覧できます。
                    </p>
                    {plans && plans.length > 0 && (() => {
                      const requiredPlans = plans.filter(p => p.tier >= (post.membershipTier || 1));
                      if (requiredPlans.length > 0) {
                        return (
                          <div className="w-full space-y-2">
                            <p className="text-sm font-medium">閲覧に必要なプラン:</p>
                            <div className="grid gap-2">
                              {requiredPlans.map(plan => (
                                <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                  <div>
                                    <p className="font-medium">{plan.name}</p>
                                    <p className="text-xs text-muted-foreground">{plan.subscriberCount}人が加入中</p>
                                  </div>
                                  <p className="text-lg font-bold">￥{plan.price.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">/月</span></p>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    {isAuthenticated ? (
                      <Button size="lg" onClick={handleSubscribe}>
                        プランを見る
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          プランに加入するにはログインが必要です
                        </p>
                        <Button size="lg" asChild>
                          <a href={`/api/oauth/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                            ログインして加入
                          </a>
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              <span>{post.likeCount}</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentCount}</span>
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString("ja-JP")}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setReportDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    通報する
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </Card>

        {/* コメントセクション */}
        <Card className="p-6 space-y-6">
          <h2 className="text-xl font-bold">コメント ({post.commentCount})</h2>

          {/* コメント投稿フォーム */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="コメントを入力..."
                className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={500}
              />
              <Button type="submit" disabled={!commentContent.trim() || commentMutation.isPending} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>コメントするにはログインが必要です</p>
              <Button className="mt-2" asChild>
                <a href={`/api/oauth/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                  ログイン
                </a>
              </Button>
            </div>
          )}

          {/* コメント一覧 */}
          <div className="space-y-4">
            {comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/30">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{comment.userDisplayName?.charAt(0) || "?"}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.userDisplayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">まだコメントがありません</p>
            )}
          </div>
        </Card>
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
