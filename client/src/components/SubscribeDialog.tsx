import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Crown, CreditCard, Coins, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Plan {
  id: number;
  name: string;
  price: number;
  tier: number;
  description: string | null;
  benefits: string | null;
  subscriberCount: number;
  isAdult?: number;
}

interface SubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  creatorId: number;
  creatorName: string;
  requiredTier?: number;
  onSuccess?: () => void;
}

type PaymentMethod = "points" | "stripe";

export function SubscribeDialog({
  open,
  onOpenChange,
  plans,
  creatorId,
  creatorName,
  requiredTier,
  onSuccess
}: SubscribeDialogProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("points");
  const [isProcessing, setIsProcessing] = useState(false);

  // Check current subscription status
  const { data: subStatus } = trpc.subscription.checkSubscription.useQuery(
    { creatorId },
    { enabled: open }
  );

  // Get subscription options for selected plan
  const { data: options, isLoading } = trpc.subscription.getSubscriptionOptions.useQuery(
    { planId: selectedPlanId! },
    { enabled: open && !!selectedPlanId }
  );

  // Mutations
  const subscribeWithPoints = trpc.subscription.subscribeWithPoints.useMutation();
  const createStripeSubscription = trpc.subscription.createStripeSubscription.useMutation();

  const utils = trpc.useUtils();

  // Filter plans that meet the required tier
  const availablePlans = requiredTier
    ? plans.filter(p => p.tier >= requiredTier)
    : plans;

  // Auto-select first plan if required tier is specified
  useEffect(() => {
    if (open && requiredTier && availablePlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(availablePlans[0].id);
    }
  }, [open, requiredTier, availablePlans, selectedPlanId]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedPlanId(null);
      setSelectedMethod("points");
    }
    onOpenChange(newOpen);
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const userBalance = options?.userBalance ?? 0;
  const isAdult = options?.isAdult ?? false;
  const canAffordWithPoints = selectedPlan ? userBalance >= selectedPlan.price : false;

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error("プランを選択してください");
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

        await subscribeWithPoints.mutateAsync({ planId: selectedPlan.id });

        toast.success(`${selectedPlan.name}に加入しました！`, {
          description: `${creatorName}のコンテンツを楽しめます`,
        });

        utils.subscription.checkSubscription.invalidate({ creatorId });
        utils.subscription.getMySubscriptions.invalidate();
        utils.point.getBalance.invalidate();

        handleOpenChange(false);
        onSuccess?.();
      } else if (selectedMethod === "stripe") {
        const result = await createStripeSubscription.mutateAsync({
          planId: selectedPlan.id,
          successUrl: `${window.location.origin}/creator/${encodeURIComponent(location.pathname.split('/')[2] || '')}?subscribed=true`,
          cancelUrl: `${window.location.origin}${location.pathname}?canceled=true`,
        });

        if (result.url) {
          window.location.href = result.url;
        }
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      toast.error("加入に失敗しました", {
        description: error instanceof Error ? error.message : "エラーが発生しました",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Already subscribed view
  if (subStatus?.subscribed && subStatus.subscription) {
    const currentPlan = plans.find(p => p.id === subStatus.subscription?.planId);

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle>加入済みです</DialogTitle>
            <DialogDescription>
              現在「{currentPlan?.name || subStatus.subscription.planName}」に加入中です。
            </DialogDescription>
          </DialogHeader>

          {/* Upgrade option if there are higher tiers */}
          {plans.some(p => p.tier > (subStatus.subscription?.planTier ?? 0)) && (
            <div className="space-y-2 py-4">
              <p className="text-sm text-muted-foreground text-center">
                より上位のプランにアップグレードできます
              </p>
              <div className="space-y-2">
                {plans
                  .filter(p => p.tier > (subStatus.subscription?.planTier ?? 0))
                  .map(plan => (
                    <Card
                      key={plan.id}
                      className="p-3 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {plan.subscriberCount}人が加入中
                          </p>
                        </div>
                        <p className="text-lg font-bold">
                          ¥{plan.price.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">/月</span>
                        </p>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
          <DialogTitle className="text-center">
            月額支援プランに加入
          </DialogTitle>
          <DialogDescription className="text-center">
            {creatorName}を月額で支援して限定コンテンツを楽しもう
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Plan selection */}
          <div className="space-y-2">
            {availablePlans.map(plan => {
              let benefits: string[] = [];
              try {
                benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
              } catch {
                benefits = [];
              }

              const isSelected = selectedPlanId === plan.id;
              const isRecommended = requiredTier && plan.tier === requiredTier;

              return (
                <Card
                  key={plan.id}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}>
                      {isSelected && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{plan.name}</h4>
                          {isRecommended && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              おすすめ
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold">
                          ¥{plan.price.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground">/月</span>
                        </p>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      )}
                      {benefits.length > 0 && (
                        <ul className="text-sm space-y-1">
                          {benefits.slice(0, 3).map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                          {benefits.length > 3 && (
                            <li className="text-muted-foreground">
                              +{benefits.length - 3}件の特典
                            </li>
                          )}
                        </ul>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {plan.subscriberCount}人が加入中
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Show options when plan is selected */}
          {selectedPlanId && (
            <>
              {isLoading ? (
                <div className="py-4 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
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
                      <span>アダルトプランはポイントでのみ加入可能です</span>
                    </div>
                  )}

                  {/* Payment method selection */}
                  {!isAdult && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">支払い方法を選択</p>
                      <div className="grid gap-2">
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
                                ? `${selectedPlan?.price.toLocaleString()} pt/月`
                                : "残高不足"}
                            </p>
                          </div>
                          {selectedMethod === "points" && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>

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
                              ¥{selectedPlan?.price.toLocaleString()}/月
                            </p>
                          </div>
                          {selectedMethod === "stripe" && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Subscription notes */}
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 加入後すぐに限定コンテンツを閲覧できます</li>
            <li>• 毎月自動更新されます（いつでも解約可能）</li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full sm:w-auto"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={isProcessing || !selectedPlan || (selectedMethod === "points" && !canAffordWithPoints)}
            className="w-full sm:w-auto gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : !selectedPlan ? (
              "プランを選択"
            ) : selectedMethod === "points" ? (
              <>
                <Coins className="h-4 w-4" />
                {selectedPlan.price.toLocaleString()} pt/月で加入
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                ¥{selectedPlan.price.toLocaleString()}/月で加入
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
