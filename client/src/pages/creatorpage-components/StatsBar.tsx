import { Users, Heart, Sparkles } from "lucide-react";

interface StatsBarProps {
  followerCount: number;
  totalSupport: number;
  showStats: boolean;
}

export function StatsBar({ followerCount, totalSupport, showStats }: StatsBarProps) {
  if (!showStats) return null;

  return (
    <div
      className="py-4 border-y border-border/30 animate-in fade-in duration-500"
      style={{ animationDelay: "200ms", animationFillMode: "both" }}
    >
      <div className="container max-w-2xl">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="font-semibold text-foreground tabular-nums">
              {followerCount.toLocaleString()}
            </span>
            <span className="text-sm">フォロワー</span>
          </div>

          {totalSupport > 0 && (
            <>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground tabular-nums">
                  ¥{totalSupport.toLocaleString()}
                </span>
                <span className="text-sm">サポート</span>
              </div>
            </>
          )}

          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Creator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
