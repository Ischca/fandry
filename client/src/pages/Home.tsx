import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Heart, Sparkles, Users, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  // ログイン済みユーザーはフィードページにリダイレクト
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/feed");
    }
  }, [isAuthenticated, loading, setLocation]);

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/feed">
                  <Button variant="ghost">フィード</Button>
                </Link>
                <Link href="/discover">
                  <Button variant="ghost">発見</Button>
                </Link>
                <Link href="/my">
                  <Button variant="default">マイページ</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href="/discover">
                  <Button variant="ghost">クリエイターを探す</Button>
                </Link>
                <SignInButton mode="modal">
                  <Button variant="default">ログイン</Button>
                </SignInButton>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>感謝を、1秒で届ける</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            あなたの「応援」が、
            <br />
            <span className="text-primary">クリエイターを支える</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Fandryは、クリエイターとファンをつなぐパトロン型支援プラットフォームです。
            <br />
            投げ銭、有料コンテンツ、月額支援で、好きなクリエイターを応援しよう。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/discover">
              <Button size="lg" className="text-lg px-8">
                クリエイターを探す
              </Button>
            </Link>
            {!isAuthenticated && (
              <SignInButton mode="modal">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  無料で始める
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="container py-20 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">Fandryの特徴</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">ワンクリック投げ銭</h3>
              <p className="text-muted-foreground">
                決済画面を挟まず、1秒で「応援」の気持ちを届けられます。
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">低手数料</h3>
              <p className="text-muted-foreground">
                投げ銭は8%、その他は10%の業界最安水準の手数料。
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">パトロンバッジ</h3>
              <p className="text-muted-foreground">
                累計支援額に応じてバッジを獲得。あなたの貢献を可視化します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center space-y-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold">今すぐ始めよう</h2>
          <p className="text-lg text-muted-foreground">
            あなたの「応援」が、クリエイターの活動を支えます。
          </p>
          <Link href="/discover">
            <Button size="lg" className="text-lg px-8">
              クリエイターを探す
            </Button>
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t py-8 bg-card/50">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2024 Fandry. All rights reserved.
            </p>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                プライバシーポリシー
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
