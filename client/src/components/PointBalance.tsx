import { Coins } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export function PointBalance() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: balance } = trpc.point.getBalance.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <Link href="/points">
      <Button variant="ghost" size="sm" className="gap-2">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="font-medium">
          {balance?.balance?.toLocaleString() ?? 0}
          <span className="text-xs text-muted-foreground ml-1">pt</span>
        </span>
      </Button>
    </Link>
  );
}
