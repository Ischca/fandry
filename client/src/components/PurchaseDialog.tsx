import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Lock, Coins, CreditCard, Check, AlertTriangle, Loader2 } from "lucide-react";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  postTitle: string | null;
  price: number;
  creatorName: string;
  onSuccess?: () => void;
}

type PaymentMethod = "points" | "stripe" | "hybrid";

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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("points");
  const [pointsToUse, setPointsToUse] = useState(0);

  // Get purchase options for this post
  const { data: options, isLoading } = trpc.purchase.getPurchaseOptions.useQuery(
    { postId },
    { enabled: open }
  );

  // Mutations
  const purchaseWithPoints = trpc.purchase.purchaseWithPoints.useMutation();
  const createStripeCheckout = trpc.purchase.createStripeCheckout.useMutation();
  const createHybridCheckout = trpc.purchase.createHybridCheckout.useMutation();

  const utils = trpc.useUtils();

  // Reset state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedMethod("points");
      setPointsToUse(0);
    }
    onOpenChange(newOpen);
  };

  // If already purchased
  if (options?.alreadyPurchased) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const userBalance = options?.userBalance ?? 0;
  const isAdult = options?.isAdult ?? false;
  const canAffordWithPoints = userBalance >= price;
  const stripeAmount = selectedMethod === "hybrid" ? price - pointsToUse : price;
  const maxPointsToUse = Math.min(userBalance, price);

  const handlePurchase = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (selectedMethod === "points") {
        // Points-only purchase
        if (!canAffordWithPoints) {
          toast.error("ポイント残高が不足しています");
          setIsProcessing(false);
          return;
        }

        await purchaseWithPoints.mutateAsync({ postId });

        toast.success("購入が完了しました！", {
          description: `${postTitle || "コンテンツ"}を購入しました`,
        });

        // Invalidate queries
        utils.post.getById.invalidate({ id: postId });
        utils.point.getBalance.invalidate();

        handleOpenChange(false);
        onSuccess?.();
      } else if (selectedMethod === "stripe") {
        // Stripe direct purchase
        const result = await createStripeCheckout.mutateAsync({
          postId,
          successUrl: `${window.location.origin}/post/${postId}?purchased=true`,
          cancelUrl: `${window.location.origin}/post/${postId}?canceled=true`,
        });

        if (result.url) {
          window.location.href = result.url;
        }
      } else if (selectedMethod === "hybrid") {
        // Hybrid purchase
        const result = await createHybridCheckout.mutateAsync({
          postId,
          pointsToUse,
          successUrl: `${window.location.origin}/post/${postId}?purchased=true`,
          cancelUrl: `${window.location.origin}/post/${postId}?canceled=true`,
        });

        if (result.requiresStripe && result.url) {
          window.location.href = result.url;
        } else {
          // All paid with points
          toast.success("購入が完了しました！", {
            description: `${postTitle || "コンテンツ"}を購入しました`,
          });

          utils.post.getById.invalidate({ id: postId });
          utils.point.getBalance.invalidate();

          handleOpenChange(false);
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("購入に失敗しました", {
        description: error instanceof Error ? error.message : "エラーが発生しました",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
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

            {/* Point balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium">ポイント残高</span>
              </div>
              <span className="font-bold">
                {userBalance.toLocaleString()} pt
              </span>
            </div>

            {/* Adult content notice */}
            {isAdult && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>アダルトコンテンツはポイントでのみ購入可能です</span>
              </div>
            )}

            {/* Payment method selection */}
            {!isAdult && (
              <div className="space-y-3">
                <p className="text-sm font-medium">支払い方法を選択</p>
                <div className="grid gap-2">
                  {/* Points */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("points")}
                    disabled={!canAffordWithPoints}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedMethod === "points"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${!canAffordWithPoints ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="font-medium">ポイントで支払い</p>
                      <p className="text-xs text-muted-foreground">
                        {canAffordWithPoints
                          ? `${price.toLocaleString()} pt 使用`
                          : "残高不足"}
                      </p>
                    </div>
                    {selectedMethod === "points" && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>

                  {/* Stripe */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("stripe")}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedMethod === "stripe"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">クレジットカード</p>
                      <p className="text-xs text-muted-foreground">
                        ¥{price.toLocaleString()} を支払い
                      </p>
                    </div>
                    {selectedMethod === "stripe" && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>

                  {/* Hybrid */}
                  {userBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod("hybrid");
                        setPointsToUse(Math.min(userBalance, price));
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedMethod === "hybrid"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex -space-x-1">
                        <Coins className="h-5 w-5 text-yellow-500" />
                        <CreditCard className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">ポイント + カード</p>
                        <p className="text-xs text-muted-foreground">
                          ポイントで一部を割引
                        </p>
                      </div>
                      {selectedMethod === "hybrid" && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Hybrid slider */}
            {selectedMethod === "hybrid" && (
              <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span>使用ポイント</span>
                  <span className="font-medium">{pointsToUse.toLocaleString()} pt</span>
                </div>
                <Slider
                  value={[pointsToUse]}
                  onValueChange={([value]) => setPointsToUse(value)}
                  max={maxPointsToUse}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 pt</span>
                  <span>{maxPointsToUse.toLocaleString()} pt</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>カード支払い</span>
                    <span className="font-bold">¥{stripeAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase notes */}
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 購入後すぐに全文を閲覧できます</li>
              <li>• デジタルコンテンツのため返金はできません</li>
            </ul>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isProcessing || isLoading || (selectedMethod === "points" && !canAffordWithPoints)}
            className="w-full sm:w-auto gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : selectedMethod === "points" ? (
              <>
                <Coins className="h-4 w-4" />
                {price.toLocaleString()} pt で購入
              </>
            ) : selectedMethod === "stripe" ? (
              <>
                <CreditCard className="h-4 w-4" />
                ¥{price.toLocaleString()} で購入
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                ¥{stripeAmount.toLocaleString()} で購入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
