import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { PostCard } from "@/components/PostCard";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Loader2, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Feed() {
  const { isAuthenticated, loading: authLoading } = useAuth();
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
          <SignInButton mode="modal">
            <Button size="lg">ログイン</Button>
          </SignInButton>
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
      <Header />

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
