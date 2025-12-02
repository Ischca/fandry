import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { MediaUploader } from "@/components/MediaUploader";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Link } from "wouter";

interface UploadedMedia {
  id?: number;
  url: string;
  key: string;
  type: "image" | "video";
  mimeType: string;
  size: number;
}

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id || "0");
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [type, setType] = React.useState<"free" | "paid" | "membership">("free");
  const [price, setPrice] = React.useState("");
  const [membershipTier, setMembershipTier] = React.useState("1");
  const [uploadedMedia, setUploadedMedia] = React.useState<UploadedMedia[]>([]);
  const [useUrlInput, setUseUrlInput] = React.useState(false);
  const [mediaUrls, setMediaUrls] = React.useState("");
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Fetch post data
  const { data: post, isLoading } = trpc.post.getById.useQuery(
    { id: postId },
    { enabled: postId > 0 }
  );

  // Initialize form with post data
  React.useEffect(() => {
    if (post && !isLoaded) {
      setTitle(post.title || "");
      setContent(post.content || "");
      setType(post.type as "free" | "paid" | "membership");
      setPrice(post.price?.toString() || "");
      setMembershipTier(post.membershipTier?.toString() || "1");

      // Parse media URLs
      if (post.mediaUrls) {
        try {
          const urls = JSON.parse(post.mediaUrls);
          if (Array.isArray(urls) && urls.length > 0) {
            // Convert URLs to UploadedMedia format for display
            const media = urls.map((url: string, index: number) => ({
              url,
              key: `existing-${index}`,
              type: url.match(/\.(mp4|webm|mov)$/i) ? "video" : "image" as "image" | "video",
              mimeType: "unknown",
              size: 0,
            }));
            setUploadedMedia(media);
          }
        } catch {
          setMediaUrls(post.mediaUrls);
          setUseUrlInput(true);
        }
      }

      setIsLoaded(true);
    }
  }, [post, isLoaded]);

  const updateMutation = trpc.post.update.useMutation({
    onSuccess: () => {
      toast.success("投稿を更新しました");
      setLocation("/manage-posts");
    },
    onError: (error) => {
      toast.error(`更新に失敗しました: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const postData: {
      id: number;
      title?: string;
      content?: string;
      type?: "free" | "paid" | "membership";
      price?: number;
      membershipTier?: number;
      mediaUrls?: string;
    } = {
      id: postId,
      content,
      type,
    };

    if (title) postData.title = title;
    if (type === "paid" && price) postData.price = parseInt(price);
    if (type === "membership") postData.membershipTier = parseInt(membershipTier);

    // Use uploaded media URLs or manual URL input
    if (uploadedMedia.length > 0) {
      postData.mediaUrls = JSON.stringify(uploadedMedia.map(m => m.url));
    } else if (mediaUrls) {
      const urls = mediaUrls.split(",").map(url => url.trim()).filter(url => url);
      if (urls.length > 0) {
        postData.mediaUrls = JSON.stringify(urls);
      }
    }

    updateMutation.mutate(postData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">ログインが必要です</h2>
          <p className="text-muted-foreground mb-4">投稿を編集するにはログインしてください</p>
          <Button asChild>
            <a href={`/api/oauth/login?redirect=/edit-post/${postId}`}>ログイン</a>
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">投稿が見つかりません</h2>
          <Button onClick={() => setLocation("/manage-posts")}>
            投稿管理に戻る
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
            <h1 className="text-lg font-semibold">投稿を編集</h1>
          </div>
          <Button variant="outline" onClick={() => setLocation("/manage-posts")}>
            キャンセル
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            {/* タイトル */}
            <div className="space-y-2">
              <label className="text-sm font-medium">タイトル（任意）</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="投稿のタイトルを入力..."
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={256}
              />
            </div>

            {/* 本文 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">本文 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="投稿の内容を入力..."
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px]"
                required
              />
            </div>

            {/* メディア */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">画像・動画（任意）</label>
                <button
                  type="button"
                  onClick={() => setUseUrlInput(!useUrlInput)}
                  className="text-xs text-primary hover:underline"
                >
                  {useUrlInput ? "アップロードに切り替え" : "URL入力に切り替え"}
                </button>
              </div>

              {useUrlInput ? (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={mediaUrls}
                    onChange={(e) => setMediaUrls(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">
                    複数の画像URLをカンマ区切りで入力できます
                  </p>
                </div>
              ) : (
                <MediaUploader
                  value={uploadedMedia}
                  onChange={setUploadedMedia}
                  maxFiles={10}
                  disabled={updateMutation.isPending}
                />
              )}
            </div>

            {/* 投稿タイプ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">投稿タイプ *</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setType("free")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    type === "free"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  無料
                </button>
                <button
                  type="button"
                  onClick={() => setType("paid")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    type === "paid"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  有料
                </button>
                <button
                  type="button"
                  onClick={() => setType("membership")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    type === "membership"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  会員限定
                </button>
              </div>
            </div>

            {/* 有料設定 */}
            {type === "paid" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">価格（円） *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="400"
                  min="100"
                  max="10000"
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  100円〜10,000円の範囲で設定してください
                </p>
              </div>
            )}

            {/* 会員限定設定 */}
            {type === "membership" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">必要なプラン階層 *</label>
                <select
                  value={membershipTier}
                  onChange={(e) => setMembershipTier(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="1">ベーシック（Tier 1）以上</option>
                  <option value="2">スタンダード（Tier 2）以上</option>
                  <option value="3">プレミアム（Tier 3）以上</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  選択した階層以上のプランに加入しているファンが閲覧できます
                </p>
              </div>
            )}
          </Card>

          {/* 送信ボタン */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/manage-posts")}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!content || updateMutation.isPending}
            >
              {updateMutation.isPending ? "更新中..." : "更新する"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
