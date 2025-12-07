import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  User,
  Copy,
  Check,
  Share2,
  Twitter,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface ShareCardProps {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  followerCount: number;
  totalSupport: number;
}

export function ShareCard({
  username,
  displayName,
  avatarUrl,
  followerCount,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/creator/${username}`
      : "";
  const tipUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/tip/${username}`
      : "";

  const handleCopy = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(`${label}をコピーしました`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("コピーに失敗しました");
    }
  };

  const handleShareTwitter = () => {
    const text = `${displayName}のクリエイターページをチェック！`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="gap-2 bg-gradient-to-r from-primary to-[oklch(0.55_0.18_35)] hover:opacity-90 text-white shadow-lg shadow-primary/25 font-semibold"
        >
          <Share2 className="h-4 w-4" />
          シェアする
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-hidden p-0">
        {/* Preview Card */}
        <div className="relative bg-gradient-to-br from-primary/10 via-background to-[oklch(0.85_0.16_85)]/10 p-6">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIi8+PC9nPjwvc3ZnPg==')] opacity-50" />

          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-card shadow-lg overflow-hidden ring-2 ring-white/50">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <User className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{displayName}</h3>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">フォロワー</p>
              <p className="font-bold text-primary">
                {followerCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <DialogHeader className="px-6 pt-4">
          <DialogTitle>プロフィールをシェア</DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-4">
          {/* Quick Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleShareTwitter}
              className="gap-2 h-12"
            >
              <Twitter className="h-4 w-4" />
              X (Twitter)
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopy(profileUrl, "プロフィールリンク")}
              className="gap-2 h-12"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
              リンクをコピー
            </Button>
          </div>

          {/* Tip Link */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[oklch(0.85_0.16_85)]/10 to-primary/5 border border-[oklch(0.85_0.16_85)]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[oklch(0.85_0.16_85)]/20 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-[oklch(0.7_0.14_85)]" />
                </div>
                <div>
                  <p className="font-medium text-sm">チップリンク</p>
                  <p className="text-xs text-muted-foreground">
                    応援を受け取る専用リンク
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCopy(tipUrl, "チップリンク")}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                コピー
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
