import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Heart, CreditCard, Coins, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useTipCelebration } from "./TipCelebration";

interface TipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: number;
  creatorName: string;
}

type PaymentMethod = "points" | "stripe" | "hybrid";

export function TipDialog({ open, onOpenChange, creatorId, creatorName }: TipDialogProps) {
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("points");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { showCelebration, CelebrationComponent } = useTipCelebration();

  // Get tip options
  const { data: options, isLoading } = trpc.tip.getTipOptions.useQuery(
    { creatorId },
    { enabled: open }
  );

  // Mutations
  const sendWithPoints = trpc.tip.sendWithPoints.useMutation();
  const createStripeCheckout = trpc.tip.createStripeCheckout.useMutation();
  const createHybridCheckout = trpc.tip.createHybridCheckout.useMutation();

  const utils = trpc.useUtils();

  const presetAmounts = options?.presetAmounts ?? [100, 500, 1000, 3000, 5000, 10000];
  const userBalance = options?.userBalance ?? 0;
  const isAdult = options?.isAdult ?? false;
  const canAffordWithPoints = userBalance >= amount;
  const stripeAmount = selectedMethod === "hybrid" ? amount - pointsToUse : amount;
  const maxPointsToUse = Math.min(userBalance, amount);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setAmount(500);
      setCustomAmount("");
      setMessage("");
      setSelectedMethod("points");
      setPointsToUse(0);
    }
    onOpenChange(newOpen);
  };

  const handleTip = async () => {
    if (amount < 100) {
      toast.error("最低金額は100円です");
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (selectedMethod === "points") {
        if (!canAffordWithPoints) {
          toast.error("ポイント残高が不足しています");
          setIsProcessing(false);
          return;
        }

        await sendWithPoints.mutateAsync({
          creatorId,
          amount,
          message: message || undefined,
        });

        showCelebration(amount, creatorName);
        toast.success("応援を送りました！", {
          description: `${creatorName}さんに${amount}円の応援を送りました`,
        });

        utils.point.getBalance.invalidate();
        handleOpenChange(false);
      } else if (selectedMethod === "stripe") {
        const result = await createStripeCheckout.mutateAsync({
          creatorId,
          amount,
          message: message || undefined,
          successUrl: `${window.location.origin}${window.location.pathname}?tip_success=true`,
          cancelUrl: `${window.location.origin}${window.location.pathname}?tip_canceled=true`,
        });

        if (result.url) {
          window.location.href = result.url;
        }
      } else if (selectedMethod === "hybrid") {
        const result = await createHybridCheckout.mutateAsync({
          creatorId,
          amount,
          pointsToUse,
          message: message || undefined,
          successUrl: `${window.location.origin}${window.location.pathname}?tip_success=true`,
          cancelUrl: `${window.location.origin}${window.location.pathname}?tip_canceled=true`,
        });

        if (result.requiresStripe && result.url) {
          window.location.href = result.url;
        } else {
          showCelebration(amount, creatorName);
          toast.success("応援を送りました！", {
            description: `${creatorName}さんに${amount}円の応援を送りました`,
          });

          utils.point.getBalance.invalidate();
          handleOpenChange(false);
        }
      }
    } catch (error) {
      console.error("Tip error:", error);
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "エラーが発生しました",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {CelebrationComponent}
      <Dialog open={open} onOpenChange={handleOpenChange}>
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

          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
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
                  <span>このクリエイターへのチップはポイントでのみ送れます</span>
                </div>
              )}

              {/* Amount selection */}
              <div className="space-y-2">
                <Label>金額を選択</Label>
                <div className="grid grid-cols-3 gap-2">
                  {presetAmounts.slice(0, 6).map((preset) => (
                    <Button
                      key={preset}
                      variant={amount === preset ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount("");
                        if (selectedMethod === "hybrid") {
                          setPointsToUse(Math.min(userBalance, preset));
                        }
                      }}
                    >
                      ¥{preset.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
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
                    if (!isNaN(value) && value >= 100) {
                      setAmount(value);
                      if (selectedMethod === "hybrid") {
                        setPointsToUse(Math.min(userBalance, value));
                      }
                    }
                  }}
                />
              </div>

              {/* Payment method selection */}
              {!isAdult && (
                <div className="space-y-3">
                  <Label>支払い方法</Label>
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
                        <p className="font-medium text-sm">ポイント</p>
                        <p className="text-xs text-muted-foreground">
                          {canAffordWithPoints
                            ? `${amount.toLocaleString()} pt 使用`
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
                        <p className="font-medium text-sm">カード</p>
                        <p className="text-xs text-muted-foreground">
                          ¥{amount.toLocaleString()}
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
                          setPointsToUse(Math.min(userBalance, amount));
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
                          <p className="font-medium text-sm">ポイント+カード</p>
                          <p className="text-xs text-muted-foreground">
                            組み合わせて支払い
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

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">メッセージ（任意）</Label>
                <Textarea
                  id="message"
                  placeholder="応援メッセージを添えましょう"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/500
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleTip}
              disabled={isProcessing || isLoading || amount < 100 || (selectedMethod === "points" && !canAffordWithPoints)}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : selectedMethod === "points" ? (
                <>
                  <Coins className="h-4 w-4" />
                  {amount.toLocaleString()} pt を送る
                </>
              ) : selectedMethod === "stripe" ? (
                <>
                  <CreditCard className="h-4 w-4" />
                  ¥{amount.toLocaleString()} を送る
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  ¥{stripeAmount.toLocaleString()} を送る
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Quick tip button for one-click tipping (points only)
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
  const [isProcessing, setIsProcessing] = useState(false);
  const { showCelebration, CelebrationComponent } = useTipCelebration();

  const { data: balance } = trpc.point.getBalance.useQuery();
  const sendWithPoints = trpc.tip.sendWithPoints.useMutation();
  const utils = trpc.useUtils();

  const hasEnoughPoints = (balance?.balance ?? 0) >= amount;

  const handleQuickTip = async () => {
    if (!hasEnoughPoints) {
      toast.info("ポイント残高が不足しています", {
        description: "ポイントを購入してください",
      });
      return;
    }

    setIsProcessing(true);

    try {
      await sendWithPoints.mutateAsync({
        creatorId,
        amount,
      });

      showCelebration(amount, creatorName);
      toast.success(`${creatorName}さんに¥${amount}を送りました！`);
      utils.point.getBalance.invalidate();
    } catch (error) {
      toast.error("エラーが発生しました", {
        description: error instanceof Error ? error.message : "エラーが発生しました",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {CelebrationComponent}
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={handleQuickTip}
        disabled={isProcessing || sendWithPoints.isPending}
      >
        {isProcessing || sendWithPoints.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
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
