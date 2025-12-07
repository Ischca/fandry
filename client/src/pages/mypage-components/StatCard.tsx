import { TrendingUp } from "lucide-react";

interface StatCardProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  trend?: string;
  accent?: boolean;
  large?: boolean;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  trend,
  accent = false,
  large = false,
}: StatCardProps) {
  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]
        ${large ? "row-span-2" : ""}
        ${
          accent
            ? "bg-gradient-to-br from-primary to-[oklch(0.55_0.18_35)] text-white"
            : "bg-card border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
        }
      `}
    >
      {/* Background decoration */}
      <div
        className={`absolute -right-4 -bottom-4 opacity-10 transition-transform group-hover:scale-110 ${accent ? "opacity-20" : ""}`}
      >
        <Icon className={`${large ? "h-32 w-32" : "h-20 w-20"}`} />
      </div>

      <div className="relative z-10">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
            accent ? "bg-white/20" : "bg-primary/10"
          }`}
        >
          <Icon className={`h-5 w-5 ${accent ? "text-white" : "text-primary"}`} />
        </div>

        <p
          className={`font-bold tracking-tight ${large ? "text-4xl" : "text-2xl"}`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>

        <p
          className={`text-sm mt-1 ${accent ? "text-white/80" : "text-muted-foreground"}`}
        >
          {label}
        </p>

        {trend && (
          <div
            className={`inline-flex items-center gap-1 mt-2 text-xs font-medium px-2 py-1 rounded-full ${
              accent
                ? "bg-white/20 text-white"
                : "bg-green-500/10 text-green-600"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
