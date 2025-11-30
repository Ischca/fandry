import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heart, MessageCircle, Lock, Crown } from "lucide-react";
import { Link, useParams } from "wouter";


export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const postId = parseInt(id || "0");

  const { data: post, isLoading } = trpc.post.getById.useQuery(
    { id: postId },
    { enabled: postId > 0 }
  );

  const handlePurchase = () => {
    alert("決済機能は現在準備中です。");
  };

  const handleSubscribe = () => {
    alert("月額支援機能は現在準備中です。");
  };

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
            <span className="text-xl font-bold">Cheer</span>
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

          {/* 投稿メタ情報 */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>{post.likeCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>{post.commentCount}</span>
            </div>
            <div className="ml-auto">
              {new Date(post.createdAt).toLocaleDateString("ja-JP")}
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
