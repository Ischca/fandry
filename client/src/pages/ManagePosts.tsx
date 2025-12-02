import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Heart, Plus, Edit, Trash2, Lock, Crown, Eye, MessageCircle, Image } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManagePosts() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: posts, isLoading, refetch } = trpc.post.getMyPosts.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const deleteMutation = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success("投稿を削除しました");
      refetch();
    },
    onError: (error) => {
      toast.error(`削除に失敗しました: ${error.message}`);
    },
  });

  const handleDelete = (postId: number) => {
    deleteMutation.mutate({ id: postId });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "free":
        return null;
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
            <Lock className="h-3 w-3" />
            有料
          </span>
        );
      case "membership":
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
            <Crown className="h-3 w-3" />
            会員限定
          </span>
        );
      default:
        return null;
    }
  };

  const hasMedia = (mediaUrls: string | null): boolean => {
    if (!mediaUrls) return false;
    try {
      const urls = JSON.parse(mediaUrls);
      return Array.isArray(urls) && urls.length > 0;
    } catch {
      return false;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">ログインが必要です</h2>
          <p className="text-muted-foreground mb-4">投稿管理にはログインしてください</p>
          <Button asChild>
            <a href="/api/oauth/login?redirect=/manage-posts">ログイン</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <span className="text-xl font-bold">Fandry</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-lg font-semibold">投稿管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLocation("/my")}>
              マイページ
            </Button>
            <Button onClick={() => setLocation("/create-post")}>
              <Plus className="h-4 w-4 mr-1" />
              新規投稿
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">読み込み中...</div>
        ) : !posts || posts.length === 0 ? (
          <Card className="p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">まだ投稿がありません</h2>
            <p className="text-muted-foreground mb-6">最初の投稿を作成してみましょう</p>
            <Button onClick={() => setLocation("/create-post")}>
              <Plus className="h-4 w-4 mr-1" />
              新規投稿を作成
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{posts.length}件の投稿</p>
            </div>

            <div className="space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    {hasMedia(post.mediaUrls) && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {(() => {
                          try {
                            const urls = JSON.parse(post.mediaUrls!);
                            if (urls[0]) {
                              return (
                                <img
                                  src={urls[0]}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              );
                            }
                          } catch {
                            return null;
                          }
                          return <Image className="w-8 h-8 text-muted-foreground m-auto mt-6" />;
                        })()}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {post.title && (
                              <h3 className="font-semibold truncate">{post.title}</h3>
                            )}
                            {getTypeLabel(post.type)}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {post.content}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/edit-post/${post.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>投稿を削除しますか？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  この操作は取り消せません。投稿に関連するいいね、コメント、購入履歴も削除されます。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(post.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  削除する
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.commentCount}
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                        {post.type === "paid" && post.price && (
                          <span className="text-amber-600">¥{post.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
