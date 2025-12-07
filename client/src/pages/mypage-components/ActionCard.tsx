import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color?: "primary" | "gold" | "green" | "violet";
}

export function ActionCard({
  icon: Icon,
  title,
  description,
  href,
  color = "primary",
}: ActionCardProps) {
  const colors = {
    primary:
      "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
    gold: "bg-[oklch(0.85_0.16_85)]/20 text-[oklch(0.6_0.14_85)] group-hover:bg-[oklch(0.75_0.14_85)] group-hover:text-white",
    green:
      "bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white",
    violet:
      "bg-violet-500/10 text-violet-600 group-hover:bg-violet-500 group-hover:text-white",
  };

  return (
    <Link href={href}>
      <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 transition-all duration-300 hover:border-transparent hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 cursor-pointer">
        <div className="flex items-start justify-between">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${colors[color]}`}
          >
            <Icon className="h-6 w-6" />
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground/50 transition-all group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
