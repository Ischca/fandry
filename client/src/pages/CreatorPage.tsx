import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Share2, User } from "lucide-react";
import { useParams, Link } from "wouter";
import { getLoginUrl } from "@/const";
import { TipDialog } from "@/components/TipDialog";
import { useState } from "react";

export default function CreatorPage() {
  const { username } = useParams<{ username: string }>();
  const { isAuthenticated } = useAuth();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);

  const { data: creator, isLoading: creatorLoading } = trpc.creator.getByUsername.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );

  const { data: posts, isLoading: postsLoading } = trpc.post.getByCreatorUsername.useQuery(
    { username: username || "", limit: 20 },
    { enabled: !!username }
  );

  if (creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">クリエイターが見つかりません</h1>
        <Link href="/discover">
          <Button>クリエイターを探す</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/feed">
                  <Button variant="ghost">フィード</Button>
                </Link>
                <Link href="/my">
                  <Button variant="ghost">マイページ</Button>
                </Link>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">ログイン</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {creator.coverUrl && (
        <div className="w-full h-48 md:h-64 bg-gradient-to-br from-primary/20 to-accent/20">
          <img src={creator.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative -mt-16 md:-mt-20">
            <div className="w-32 h-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden">
              {creator.avatarUrl ? (
                <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold">{creator.displayName}</h1>
              <p className="text-muted-foreground">@{creator.username}</p>
            </div>
            {creator.bio && <p className="text-foreground">{creator.bio}</p>}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{creator.followerCount} フォロワー</span>
              {creator.category && <span className="px-3 py-1 rounded-full bg-accent/20">{creator.category}</span>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            {isAuthenticated ? (
              <>
                <Button variant="outline">フォロー</Button>
                <Button className="gap-2" onClick={() => setTipDialogOpen(true)}>
                  <Heart className="h-4 w-4" />
                  応援する
                </Button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button className="gap-2">
                  <Heart className="h-4 w-4" />
                  応援する
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">
        <h2 className="text-2xl font-bold mb-6">投稿</h2>
        {postsLoading ? (
          <p className="text-muted-foreground">読み込み中...</p>
        ) : posts && posts.length > 0 ? (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="p-6 space-y-4">
                {post.title && <h3 className="text-xl font-semibold">{post.title}</h3>}
                <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{new Date(post.createdAt).toLocaleDateString("ja-JP")}</span>
                  <span>❤️ {post.likeCount}</span>
                  <span>💬 {post.commentCount}</span>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">まだ投稿がありません</p>
        )}
      </div>
      
      {isAuthenticated && (
        <TipDialog
          open={tipDialogOpen}
          onOpenChange={setTipDialogOpen}
          creatorId={creator.id}
          creatorName={creator.displayName}
        />
      )}
    </div>
  );
}
