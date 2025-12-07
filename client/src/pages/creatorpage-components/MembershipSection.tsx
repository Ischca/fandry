import { Crown, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Plan {
  id: number;
  name: string;
  price: number;
  description: string | null;
  benefits: string | null;
  subscriberCount: number;
}

interface MembershipSectionProps {
  plans: Plan[];
  onSubscribe: () => void;
}

function TierCard({
  plan,
  index,
  onSubscribe,
}: {
  plan: Plan;
  index: number;
  onSubscribe: () => void;
}) {
  let benefits: string[] = [];
  try {
    benefits = plan.benefits ? JSON.parse(plan.benefits) : [];
  } catch {
    benefits = [];
  }

  const isPopular = index === 1 && plan.subscriberCount > 0;

  return (
    <div
      className={`relative group animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        isPopular ? "md:-mt-4 md:mb-4" : ""
      }`}
      style={{ animationDelay: `${index * 100 + 200}ms`, animationFillMode: "both" }}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg">
            <Sparkles className="h-3 w-3" />
            Popular
          </span>
        </div>
      )}

      <div
        className={`h-full p-6 md:p-8 rounded-2xl border transition-all duration-300 ${
          isPopular
            ? "bg-card border-primary/30 shadow-xl shadow-primary/5"
            : "bg-card/50 border-border/50 hover:border-border hover:bg-card"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b border-border/50">
          <div
            className={`inline-flex p-3 rounded-xl mb-4 ${
              isPopular
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Crown className="h-6 w-6" />
          </div>
          <h3 className="font-serif text-xl font-bold mb-1">{plan.name}</h3>
          {plan.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {plan.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-sm text-muted-foreground">¥</span>
            <span className="font-serif text-4xl font-bold">
              {plan.price.toLocaleString()}
            </span>
            <span className="text-muted-foreground">/月</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {plan.subscriberCount}人が加入中
          </p>
        </div>

        {/* Benefits */}
        {benefits.length > 0 && (
          <ul className="space-y-3 mb-8">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Check
                  className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                    isPopular ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-foreground/80">{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <Button
          onClick={onSubscribe}
          className={`w-full ${isPopular ? "" : "bg-foreground hover:bg-foreground/90"}`}
          size="lg"
        >
          Join Membership
        </Button>
      </div>
    </div>
  );
}

export function MembershipSection({ plans, onSubscribe }: MembershipSectionProps) {
  if (plans.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/30 border-y border-border/30">
      <div className="container max-w-5xl">
        {/* Section header */}
        <div
          className="text-center mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500"
          style={{ animationFillMode: "both" }}
        >
          <h2 className="text-xs font-medium tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Membership
          </h2>
          <p className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Support My Work
          </p>
          <p className="text-muted-foreground max-w-md mx-auto">
            メンバーシップに加入して限定コンテンツにアクセス
          </p>
        </div>

        {/* Plans grid */}
        <div
          className={`grid gap-6 ${
            plans.length === 1
              ? "max-w-sm mx-auto"
              : plans.length === 2
                ? "md:grid-cols-2 max-w-2xl mx-auto"
                : "md:grid-cols-3"
          }`}
        >
          {plans.map((plan, index) => (
            <TierCard
              key={plan.id}
              plan={plan}
              index={index}
              onSubscribe={onSubscribe}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
