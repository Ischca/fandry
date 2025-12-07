import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";

interface Plan {
  id: number;
  name: string;
  price: number;
  tier: number;
  subscriberCount: number;
}

interface LockedContentProps {
  type: "paid" | "membership";
  price?: number;
  creatorDisplayName: string;
  membershipTier?: number;
  plans?: Plan[];
  onPurchase: () => void;
  onSubscribe: () => void;
}

export function LockedContent({
  type,
  price,
  creatorDisplayName,
  membershipTier,
  plans,
  onPurchase,
  onSubscribe,
}: LockedContentProps) {
  const { isAuthenticated } = useAuth();

  const requiredPlans = plans?.filter(p => p.tier >= (membershipTier || 1)) || [];

  return (
    <div className="relative -mx-4 sm:mx-0">
      {/* Blurred preview background */}
      <div className="absolute inset-0 sm:rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/80 z-10" />
        <div className="w-full h-full bg-gradient-to-br from-muted via-muted/50 to-muted/30 blur-sm" />
      </div>

      {/* Lock card */}
      <div className="relative z-20 py-16 sm:py-24 px-6">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div
            className={`inline-flex p-4 rounded-2xl ${type === "paid" ? "bg-amber-500/10" : "bg-violet-500/10"}`}
          >
            {type === "paid" ? (
              <Lock className="h-8 w-8 text-amber-600 dark:text-amber-500" />
            ) : (
              <Crown className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {type === "paid" ? "有料コンテンツ" : "会員限定コンテンツ"}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {type === "paid"
                ? `このコンテンツを閲覧するには ¥${price?.toLocaleString()} でご購入ください`
                : `${creatorDisplayName}のメンバーシップに加入すると閲覧できます`}
            </p>
          </div>

          {/* Plans for membership */}
          {type === "membership" && requiredPlans.length > 0 && (
            <div className="space-y-2 text-left">
              {requiredPlans.slice(0, 2).map(plan => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card/50 backdrop-blur-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.subscriberCount}人が加入中
                    </p>
                  </div>
                  <p className="font-bold">
                    ¥{plan.price.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground">
                      /月
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={type === "paid" ? onPurchase : onSubscribe}
              className={`w-full sm:w-auto gap-2 ${
                type === "paid"
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-violet-600 hover:bg-violet-700 text-white"
              }`}
            >
              {type === "paid" ? (
                <>¥{price?.toLocaleString()}で購入</>
              ) : (
                <>プランを見る</>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {type === "paid" ? "購入" : "加入"}するにはログインが必要です
              </p>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                ログイン
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
