import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function MyPage() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">ログインが必要です</h1>
        <a href={getLoginUrl()}>
          <Button>ログイン</Button>
        </a>
      </div>
    );
  }

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
              <Button variant="ghost">発見</Button>
            </Link>
            <Link href="/my">
              <Button variant="default">マイページ</Button>
            </Link>
          </nav>
        </div>
      </header>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">マイページ</h1>
        <div className="space-y-4">
          <p>ようこそ、{user?.name || "ゲスト"}さん</p>
          <Button variant="outline" onClick={() => logout()}>ログアウト</Button>
        </div>
      </div>
    </div>
  );
}
