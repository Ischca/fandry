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
import { Heart, CreditCard, Zap, ExternalLink } from "lucide-react";
import { useTipCelebration } from "./TipCelebration";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: number;
  creatorName: string;
}

const PRESET_AMOUNTS = [300, 500, 1000, 3000, 5000];

// Mock: Check if user has registered payment method (OCToken)
// In production, this would come from user data via API
const useHasPaymentMethod = () => {
  // For demo: check localStorage
  const hasMethod = localStorage.getItem("fandry_has_payment_method") === "true";
  return hasMethod;
};

export function TipDialog({ open, onOpenChange, creatorId, creatorName }: TipDialogProps) {
  const [amount, setAmount] = useState<number>(500);
  const [message, setMessage] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const hasPaymentMethod = useHasPaymentMethod();
  const { showCelebration, CelebrationComponent } = useTipCelebration();

  const tipMutation = trpc.tip.create.useMutation({
    onSuccess: () => {
      // お祝いエフェクトを表示
      showCelebration(amount, creatorName);
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

  // Mock: One-click payment (when user has registered payment method)
  const handleOneClickTip = async () => {
    setIsProcessing(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production: Call Segpay One-Click Service API
    // For now, just call the existing tip mutation
    tipMutation.mutate({
      creatorId,
      amount,
      message: message || undefined,
    });

    setIsProcessing(false);
  };

  // Mock: Redirect to Segpay payment page (first-time payment)
  const handleFirstTimePayment = () => {
    // In production: Generate Segpay checkout URL and redirect
    // For now: Show a demo message and simulate registration
    toast.info("決済ページへ移動します", {
      description: "Segpay審査完了後に実際の決済ページへ遷移します",
    });

    // Simulate successful payment registration
    setTimeout(() => {
      localStorage.setItem("fandry_has_payment_method", "true");
      toast.success("決済方法を登録しました", {
        description: "次回からワンクリックで応援できます",
      });

      // Complete the tip
      tipMutation.mutate({
        creatorId,
        amount,
        message: message || undefined,
      });
    }, 1500);

    onOpenChange(false);
  };

  const handleTip = () => {
    if (amount < 100) {
      toast.error("最低金額は100円です");
      return;
    }

    if (hasPaymentMethod) {
      handleOneClickTip();
    } else {
      handleFirstTimePayment();
    }
  };

  return (
    <>
      {CelebrationComponent}
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
          {/* Payment method indicator */}
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            hasPaymentMethod
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}>
            {hasPaymentMethod ? (
              <>
                <Zap className="h-4 w-4" />
                <span>ワンクリック決済が利用可能です</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>初回は決済ページでカード登録が必要です</span>
              </>
            )}
          </div>

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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            onClick={handleTip}
            disabled={isProcessing || tipMutation.isPending}
            className="gap-2"
          >
            {isProcessing || tipMutation.isPending ? (
              "処理中..."
            ) : hasPaymentMethod ? (
              <>
                <Zap className="h-4 w-4" />
                ¥{amount.toLocaleString()}を送る
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                決済ページへ
              </>
            )}
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Quick tip button for one-click tipping (used in feed, post detail, etc.)
interface QuickTipButtonProps {
  creatorId: number;
  creatorName: string;
  amount?: number;
  className?: string;
}

export function QuickTipButton({
  creatorId,
  creatorName,
  amount = 500,
  className
}: QuickTipButtonProps) {
  const hasPaymentMethod = useHasPaymentMethod();
  const [isProcessing, setIsProcessing] = useState(false);
  const { showCelebration, CelebrationComponent } = useTipCelebration();

  const tipMutation = trpc.tip.create.useMutation({
    onSuccess: () => {
      showCelebration(amount, creatorName);
      toast.success(`${creatorName}さんに¥${amount}を送りました！`);
    },
    onError: (error) => {
      toast.error("エラーが発生しました", {
        description: error.message,
      });
    },
  });

  const handleQuickTip = async () => {
    if (!hasPaymentMethod) {
      toast.info("先に決済方法を登録してください", {
        description: "クリエイターページの「応援する」から登録できます",
      });
      return;
    }

    setIsProcessing(true);

    // Simulate one-click payment
    await new Promise(resolve => setTimeout(resolve, 500));

    tipMutation.mutate({
      creatorId,
      amount,
    });

    setIsProcessing(false);
  };

  return (
    <>
      {CelebrationComponent}
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={handleQuickTip}
        disabled={isProcessing || tipMutation.isPending}
      >
        {isProcessing || tipMutation.isPending ? (
          "..."
        ) : (
          <>
            <Heart className="h-3 w-3 mr-1" />
            ¥{amount}
          </>
        )}
      </Button>
    </>
  );
}
