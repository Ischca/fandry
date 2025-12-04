import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { PointBalance } from "@/components/PointBalance";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, PenSquare } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Feed() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: posts, isLoading } = trpc.feed.getFollowingPosts.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <Heart className="h-16 w-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">フィードを見るにはログインが必要です</h1>
          <p className="text-muted-foreground">
            フォロー中のクリエイターの最新投稿をチェックしましょう
          </p>
          <Button asChild size="lg">
            <a href={getLoginUrl()}>ログイン</a>
          </Button>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-3xl font-bold">まだ投稿がありません</h1>
          <p className="text-muted-foreground">
            クリエイターをフォローして、最新の投稿をチェックしましょう
          </p>
          <Button asChild size="lg">
            <Link href="/discover">クリエイターを探す</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              <span className="font-bold text-xl">Fandry</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/feed">
              <span className="text-sm font-medium text-primary cursor-pointer">フィード</span>
            </Link>
            <Link href="/discover">
              <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">発見</span>
            </Link>
            <Link href="/create-post">
              <Button variant="outline" size="sm" className="gap-2">
                <PenSquare className="h-4 w-4" />
                投稿
              </Button>
            </Link>
            <PointBalance />
            <Link href="/my">
              <Button variant="default" size="sm">マイページ</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Feed Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">フォロー中の投稿</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
