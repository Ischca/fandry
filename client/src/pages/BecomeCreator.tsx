import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Heart, Crown, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "illustration", label: "イラスト" },
  { value: "manga", label: "漫画" },
  { value: "cosplay", label: "コスプレ" },
  { value: "photo", label: "写真" },
  { value: "video", label: "動画" },
  { value: "music", label: "音楽" },
  { value: "vtuber", label: "VTuber" },
  { value: "game", label: "ゲーム" },
  { value: "other", label: "その他" },
];

export default function BecomeCreator() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [usernameError, setUsernameError] = React.useState("");

  const createMutation = trpc.creator.create.useMutation({
    onSuccess: () => {
      toast.success("クリエイター登録が完了しました！");
      setLocation("/my");
    },
    onError: (error) => {
      if (error.message.includes("USERNAME_TAKEN") || error.message.includes("既に使用")) {
        setUsernameError("このユーザー名は既に使用されています");
      } else {
        toast.error(`エラー: ${error.message}`);
      }
    },
  });

  const validateUsername = (value: string) => {
    const trimmed = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (trimmed !== value) {
      setUsernameError("英数字と_のみ使用できます");
    } else if (trimmed.length < 3) {
      setUsernameError("3文字以上で入力してください");
    } else if (trimmed.length > 64) {
      setUsernameError("64文字以下で入力してください");
    } else {
      setUsernameError("");
    }
    return trimmed;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    validateUsername(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameError) return;
    if (username.length < 3) {
      setUsernameError("3文字以上で入力してください");
      return;
    }

    createMutation.mutate({
      username,
      displayName,
      bio: bio || undefined,
      category: category || undefined,
    });
  };

  const isFormValid = username.length >= 3 && displayName.length >= 1 && !usernameError;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Crown className="h-12 w-12 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-4">ログインが必要です</h2>
          <p className="text-muted-foreground mb-6">
            クリエイター登録をするにはログインしてください
          </p>
          <SignInButton mode="modal">
            <Button>ログイン</Button>
          </SignInButton>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <Button variant="outline" onClick={() => setLocation("/my")}>
            キャンセル
          </Button>
        </div>
      </header>

      <main className="container max-w-xl py-8">
        <div className="text-center mb-8">
          <Crown className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-2">クリエイターになる</h1>
          <p className="text-muted-foreground">
            ファンからの応援を受け取って活動を広げましょう
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            {/* ユーザー名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                ユーザー名 <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="username"
                  className={`w-full pl-8 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                    usernameError ? "border-destructive" : ""
                  }`}
                  maxLength={64}
                  required
                />
              </div>
              {usernameError ? (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {usernameError}
                </p>
              ) : username.length >= 3 ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  使用可能なユーザー名です
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  英数字と_のみ、3〜64文字。プロフィールURLに使用されます
                </p>
              )}
            </div>

            {/* 表示名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                表示名 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="クリエイター名"
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                maxLength={128}
                required
              />
              <p className="text-xs text-muted-foreground">
                ファンに表示される名前です。あとから変更できます
              </p>
            </div>

            {/* 自己紹介 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">自己紹介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="あなたの活動内容や作品について教えてください..."
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/1000
              </p>
            </div>

            {/* カテゴリ */}
            <div className="space-y-2">
              <label className="text-sm font-medium">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">選択してください</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                あなたの活動に最も近いカテゴリを選択してください
              </p>
            </div>
          </Card>

          {/* 注意事項 */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-medium mb-2">クリエイター登録について</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 登録後すぐにコンテンツの投稿を開始できます</li>
              <li>• メンバーシッププランを作成してサブスクリプション収入を得られます</li>
              <li>• ファンからの投げ銭や有料コンテンツの販売が可能です</li>
            </ul>
          </Card>

          {/* 送信ボタン */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/my")}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || createMutation.isPending}
            >
              {createMutation.isPending ? "登録中..." : "クリエイターになる"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
