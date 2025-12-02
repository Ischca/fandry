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
import { Crown, CreditCard, Zap, ExternalLink, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Plan {
  id: number;
  name: string;
  price: number;
  tier: number;
  description: string | null;
  benefits: string | null;
  subscriberCount: number;
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

// Mock: Check if user has registered payment method
const useHasPaymentMethod = () => {
  const hasMethod = localStorage.getItem("fandry_has_payment_method") === "true";
  return hasMethod;
};

// Mock: Check if user has active subscription to this creator
const useSubscription = (creatorId: number) => {
  const subData = localStorage.getItem(`fandry_subscription_${creatorId}`);
  if (subData) {
    try {
      return JSON.parse(subData) as { tier: number; planId: number };
    } catch {
      return null;
    }
  }
  return null;
};

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
  const [isProcessing, setIsProcessing] = useState(false);
  const hasPaymentMethod = useHasPaymentMethod();
  const currentSubscription = useSubscription(creatorId);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // Filter plans that meet the required tier
  const availablePlans = requiredTier
    ? plans.filter(p => p.tier >= requiredTier)
    : plans;

  // Mock: Subscribe to a plan
  const handleSubscribe = async () => {
    if (!selectedPlan) {
      toast.error("プランを選択してください");
      return;
    }

    if (!hasPaymentMethod) {
      // First time - redirect to payment page
      toast.info("決済ページへ移動します", {
        description: "Segpay審査完了後に実際の決済ページへ遷移します",
      });

      setTimeout(() => {
        localStorage.setItem("fandry_has_payment_method", "true");
        localStorage.setItem(`fandry_subscription_${creatorId}`, JSON.stringify({
          tier: selectedPlan.tier,
          planId: selectedPlan.id,
        }));

        toast.success(`${selectedPlan.name}に加入しました！`, {
          description: "次回からワンクリックで更新されます",
        });

        onSuccess?.();
      }, 2000);

      onOpenChange(false);
      return;
    }

    // One-click subscribe
    setIsProcessing(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    localStorage.setItem(`fandry_subscription_${creatorId}`, JSON.stringify({
      tier: selectedPlan.tier,
      planId: selectedPlan.id,
    }));

    toast.success(`${selectedPlan.name}に加入しました！`, {
      description: `${creatorName}のコンテンツを楽しめます`,
    });

    setIsProcessing(false);
    onOpenChange(false);
    onSuccess?.();
  };

  // Already subscribed view
  if (currentSubscription) {
    const currentPlan = plans.find(p => p.id === currentSubscription.planId);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle>加入済みです</DialogTitle>
            <DialogDescription>
              現在「{currentPlan?.name || "プラン"}」に加入中です。
            </DialogDescription>
          </DialogHeader>

          {/* Upgrade option if there are higher tiers */}
          {plans.some(p => p.tier > currentSubscription.tier) && (
            <div className="space-y-2 py-4">
              <p className="text-sm text-muted-foreground text-center">
                より上位のプランにアップグレードできます
              </p>
              <div className="space-y-2">
                {plans
                  .filter(p => p.tier > currentSubscription.tier)
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
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`}>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary-foreground m-auto" />
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

          {/* Payment method indicator */}
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            hasPaymentMethod
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-muted text-muted-foreground"
          }`}>
            {hasPaymentMethod ? (
              <>
                <Zap className="h-4 w-4" />
                <span>ワンクリックで加入できます</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>初回は決済ページでカード登録が必要です</span>
              </>
            )}
          </div>

          {/* Subscription notes */}
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 加入後すぐに限定コンテンツを閲覧できます</li>
            <li>• 毎月自動更新されます（いつでも解約可能）</li>
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
            onClick={handleSubscribe}
            disabled={isProcessing || !selectedPlan}
            className="w-full sm:w-auto gap-2"
          >
            {isProcessing ? (
              "処理中..."
            ) : !selectedPlan ? (
              "プランを選択"
            ) : hasPaymentMethod ? (
              <>
                <Zap className="h-4 w-4" />
                ¥{selectedPlan.price.toLocaleString()}/月で加入
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
