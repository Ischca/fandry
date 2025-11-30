import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Heart } from "lucide-react";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: number;
  creatorName: string;
}

const PRESET_AMOUNTS = [300, 500, 1000, 3000, 5000];

export function TipDialog({ open, onOpenChange, creatorId, creatorName }: TipDialogProps) {
  const [amount, setAmount] = useState<number>(500);
  const [message, setMessage] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const tipMutation = trpc.tip.create.useMutation({
    onSuccess: () => {
      toast.success("応援を送りました！", {
        description: `${creatorName}さんに${amount}円の応援を送りました`,
      });
      onOpenChange(false);
      setAmount(500);
      setMessage("");
      setCustomAmount("");
    },
    onError: (error) => {
      toast.error("エラーが発生しました", {
        description: error.message,
      });
    },
  });

  const handleTip = () => {
    if (amount < 100) {
      toast.error("最低金額は100円です");
      return;
    }
    tipMutation.mutate({
      creatorId,
      amount,
      message: message || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {creatorName}さんを応援
          </DialogTitle>
          <DialogDescription>
            投げ銭で{creatorName}さんの活動を支援しましょう
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>金額を選択</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset ? "default" : "outline"}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount("");
                  }}
                >
                  ¥{preset.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-amount">カスタム金額</Label>
            <Input
              id="custom-amount"
              type="number"
              placeholder="100円以上"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                const value = parseInt(e.target.value);
                if (!isNaN(value)) {
                  setAmount(value);
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">メッセージ（任意）</Label>
            <Textarea
              id="message"
              placeholder="応援メッセージを添えましょう"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/200
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleTip} disabled={tipMutation.isPending}>
            {tipMutation.isPending ? "送信中..." : `¥${amount.toLocaleString()}を送る`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
