import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface Plan {
  id: number;
  name: string;
  price: number;
  description: string | null;
  benefits: string | null;
  subscriberCount: number;
}

interface PlanCardProps {
  plan: Plan;
  onSubscribe: () => void;
}

export function PlanCard({ plan, onSubscribe }: PlanCardProps) {
  let benefits: string[] = [];
  try {
    benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
  } catch {
    benefits = [];
  }

  return (
    <Card
      className="p-6 space-y-4 card-interactive cursor-pointer"
      onClick={onSubscribe}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-bold text-lg">{plan.name}</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            ¥{plan.price.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">/月</p>
        </div>
      </div>
      {plan.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {plan.description}
        </p>
      )}
      {benefits.length > 0 && (
        <ul className="space-y-2 text-sm">
          {benefits.slice(0, 3).map((benefit, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{benefit}</span>
            </li>
          ))}
          {benefits.length > 3 && (
            <li className="text-muted-foreground pl-6">
              +{benefits.length - 3}件の特典
            </li>
          )}
        </ul>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          {plan.subscriberCount}人が加入中
        </p>
        <Button size="sm" className="font-semibold">
          加入する
        </Button>
      </div>
    </Card>
  );
}
