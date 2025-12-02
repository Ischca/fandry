import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, User, Copy, Check, ExternalLink } from "lucide-react";
import { useParams, Link } from "wouter";
import { getLoginUrl } from "@/const";
import { TipDialog } from "@/components/TipDialog";
import { useState } from "react";
import { toast } from "sonner";

export default function TipPage() {
  const { username } = useParams<{ username: string }>();
  const { isAuthenticated } = useAuth();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: creator, isLoading } = trpc.creator.getByUsername.useQuery(
    { username: username || "" },
    { enabled: !!username }
  );

  const tipUrl = typeof window !== "undefined"
    ? `${window.location.origin}/tip/${username}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(tipUrl);
      setCopied(true);
      toast.success("リンクをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">クリエイターが見つかりません</h1>
        <Link href="/discover">
          <Button>クリエイターを探す</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/my">
                <Button variant="ghost">マイページ</Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">ログイン</Button>
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-lg py-12">
        <Card className="p-8 text-center space-y-6">
          {/* クリエイター情報 */}
          <div className="space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full border-4 border-primary/20 bg-muted flex items-center justify-center overflow-hidden">
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{creator.displayName}</h1>
              <p className="text-muted-foreground">@{creator.username}</p>
            </div>
            {creator.bio && (
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {creator.bio}
              </p>
            )}
          </div>

          {/* 応援メッセージ */}
          <div className="py-6 space-y-2">
            <Heart className="h-8 w-8 mx-auto text-primary fill-primary animate-pulse" />
            <p className="text-lg font-medium">
              {creator.displayName}さんを応援しませんか？
            </p>
            <p className="text-sm text-muted-foreground">
              チップを送って感謝の気持ちを伝えましょう
            </p>
          </div>

          {/* 応援ボタン */}
          {isAuthenticated ? (
            <Button
              size="lg"
              className="w-full gap-2 text-lg py-6"
              onClick={() => setTipDialogOpen(true)}
            >
              <Heart className="h-5 w-5" />
              チップを送る
            </Button>
          ) : (
            <a href={getLoginUrl()} className="block">
              <Button size="lg" className="w-full gap-2 text-lg py-6">
                <Heart className="h-5 w-5" />
                ログインして応援する
              </Button>
            </a>
          )}

          {/* クリエイターページへのリンク */}
          <Link href={`/creator/${creator.username}`}>
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              クリエイターページを見る
            </Button>
          </Link>

          {/* リンク共有（クリエイター向け） */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground mb-2">このページのリンク</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tipUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm rounded-lg border bg-muted/50 truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* 実績 */}
        {(creator.followerCount > 0 || creator.totalSupport > 0) && (
          <Card className="p-4 mt-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              {creator.followerCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold">{creator.followerCount}</p>
                  <p className="text-muted-foreground">フォロワー</p>
                </div>
              )}
              {creator.totalSupport > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    ¥{creator.totalSupport.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">累計応援額</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </main>

      {/* Tip Dialog */}
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
