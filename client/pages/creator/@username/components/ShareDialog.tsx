import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Share2,
  Twitter,
  Copy,
  Check,
  Link as LinkIcon,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ShareDialogProps {
  username: string;
  displayName: string;
}

export function ShareDialog({ username, displayName }: ShareDialogProps) {
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
    const text = `${displayName}のクリエイターページ`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-11 h-11 border-2 border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-white/30"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>このページをシェア</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
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
              onClick={() => handleCopy(profileUrl, "リンク")}
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
          <div className="p-4 rounded-xl bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-sm">チップリンク</p>
                  <p className="text-xs text-muted-foreground">
                    直接応援を受け取れるリンク
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCopy(tipUrl, "チップリンク")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
