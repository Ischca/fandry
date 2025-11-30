import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Link } from "wouter";

export default function Discover() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Cheer</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/feed">
              <Button variant="ghost">フィード</Button>
            </Link>
            <Link href="/discover">
              <Button variant="default">発見</Button>
            </Link>
            <Link href="/my">
              <Button variant="ghost">マイページ</Button>
            </Link>
          </nav>
        </div>
      </header>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">クリエイターを発見</h1>
        <p className="text-muted-foreground">新しいクリエイターを探す機能（実装予定）</p>
      </div>
    </div>
  );
}
