import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";

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
  featured?: boolean;
}

export function PlanCard({
  plan,
  onSubscribe,
  featured = false,
}: PlanCardProps) {
  let benefits: string[] = [];
  try {
    benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
  } catch {
    benefits = [];
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1
        ${
          featured
            ? "bg-gradient-to-br from-primary via-primary to-[oklch(0.5_0.18_30)] text-white shadow-2xl shadow-primary/30 scale-105 z-10"
            : "bg-card border border-border/50 hover:border-primary/30 hover:shadow-xl"
        }
      `}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
            人気
          </span>
        </div>
      )}

      {/* Background Decoration */}
      <div
        className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl ${featured ? "bg-white/10" : "bg-primary/5"}`}
      />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div>
          <h3 className={`font-bold text-xl ${featured ? "text-white" : ""}`}>
            {plan.name}
          </h3>
          {plan.description && (
            <p
              className={`text-sm mt-1 line-clamp-2 ${featured ? "text-white/80" : "text-muted-foreground"}`}
            >
              {plan.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span
            className={`text-4xl font-bold tracking-tight ${featured ? "text-white" : "text-primary"}`}
          >
            ¥{plan.price.toLocaleString()}
          </span>
          <span
            className={`text-sm ${featured ? "text-white/70" : "text-muted-foreground"}`}
          >
            /月
          </span>
        </div>

        {/* Benefits */}
        {benefits.length > 0 && (
          <ul className="space-y-2.5">
            {benefits.slice(0, 4).map((benefit, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${featured ? "bg-white/20" : "bg-primary/10"}`}
                >
                  <Check
                    className={`h-3 w-3 ${featured ? "text-white" : "text-primary"}`}
                  />
                </div>
                <span
                  className={`text-sm ${featured ? "text-white/90" : "text-foreground"}`}
                >
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <Button
          onClick={onSubscribe}
          size="lg"
          className={`w-full font-semibold ${
            featured
              ? "bg-white text-primary hover:bg-white/90"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          加入する
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        {/* Subscriber Count */}
        <p
          className={`text-center text-xs ${featured ? "text-white/60" : "text-muted-foreground"}`}
        >
          {plan.subscriberCount.toLocaleString()}人が加入中
        </p>
      </div>
    </div>
  );
}
