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
import { toast } from "sonner";
import { Lock, CreditCard, Zap, ExternalLink, Check } from "lucide-react";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  postTitle: string | null;
  price: number;
  creatorName: string;
  onSuccess?: () => void;
}

// Mock: Check if user has registered payment method (OCToken)
const useHasPaymentMethod = () => {
  const hasMethod = localStorage.getItem("fandry_has_payment_method") === "true";
  return hasMethod;
};

// Mock: Check if user has purchased this post
const useHasPurchased = (postId: number) => {
  const purchased = localStorage.getItem(`fandry_purchased_${postId}`) === "true";
  return purchased;
};

export function PurchaseDialog({
  open,
  onOpenChange,
  postId,
  postTitle,
  price,
  creatorName,
  onSuccess
}: PurchaseDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const hasPaymentMethod = useHasPaymentMethod();
  const hasPurchased = useHasPurchased(postId);

  // Mock: One-click purchase
  const handleOneClickPurchase = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mark as purchased (mock)
    localStorage.setItem(`fandry_purchased_${postId}`, "true");

    toast.success("購入が完了しました！", {
      description: `${postTitle || "コンテンツ"}を購入しました`,
    });

    setIsProcessing(false);
    onOpenChange(false);
    onSuccess?.();
  };

  // Mock: Redirect to payment page (first-time)
  const handleFirstTimePayment = () => {
    toast.info("決済ページへ移動します", {
      description: "Segpay審査完了後に実際の決済ページへ遷移します",
    });

    // Simulate payment flow
    setTimeout(() => {
      localStorage.setItem("fandry_has_payment_method", "true");
      localStorage.setItem(`fandry_purchased_${postId}`, "true");

      toast.success("購入が完了しました！", {
        description: "次回からワンクリックで購入できます",
      });

      onSuccess?.();
    }, 2000);

    onOpenChange(false);
  };

  const handlePurchase = () => {
    if (hasPaymentMethod) {
      handleOneClickPurchase();
    } else {
      handleFirstTimePayment();
    }
  };

  if (hasPurchased) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle>購入済みです</DialogTitle>
            <DialogDescription>
              このコンテンツは既に購入済みです。全文を閲覧できます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Lock className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-center">
            有料コンテンツを購入
          </DialogTitle>
          <DialogDescription className="text-center">
            {creatorName}の有料コンテンツです
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Content info */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="font-medium line-clamp-2">
              {postTitle || "有料コンテンツ"}
            </h4>
            <p className="text-2xl font-bold">
              ¥{price.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                （税込）
              </span>
            </p>
          </div>

          {/* Payment method indicator */}
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            hasPaymentMethod
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}>
            {hasPaymentMethod ? (
              <>
                <Zap className="h-4 w-4" />
                <span>ワンクリック決済で購入できます</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>初回は決済ページでカード登録が必要です</span>
              </>
            )}
          </div>

          {/* Purchase notes */}
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 購入後すぐに全文を閲覧できます</li>
            <li>• デジタルコンテンツのため返金はできません</li>
            <li>• 決済はSegpayが安全に処理します</li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="w-full sm:w-auto gap-2"
          >
            {isProcessing ? (
              "処理中..."
            ) : hasPaymentMethod ? (
              <>
                <Zap className="h-4 w-4" />
                ¥{price.toLocaleString()}で購入
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
  );
}
