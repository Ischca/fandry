import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Users, Edit2, Trash2 } from "lucide-react";

interface Plan {
  id: number;
  name: string;
  price: number;
  tier: number;
  description: string | null;
  benefits: string | null;
  subscriberCount: number;
  isActive: number | null;
}

interface PlanListItemProps {
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlanListItem({ plan, onEdit, onDelete }: PlanListItemProps) {
  let benefits: string[] = [];
  try {
    benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
  } catch {
    benefits = [];
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <p className="text-sm text-muted-foreground">
                ティア {plan.tier}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold">
                ¥{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">
                  /月
                </span>
              </p>
            </div>
          </div>

          {plan.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {plan.description}
            </p>
          )}

          {benefits.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                特典:
              </p>
              <ul className="space-y-1">
                {benefits.map((benefit, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {plan.subscriberCount}人が加入中
            </span>
            {plan.isActive === 0 && (
              <span className="text-destructive">非公開</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
