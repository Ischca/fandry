import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Heart, Sparkles, Users, Zap, ArrowRight, Star } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/feed");
    }
  }, [isAuthenticated, loading, setLocation]);

  return (
    <div className="min-h-screen hero-gradient texture-noise">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <Heart className="h-7 w-7 text-primary fill-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight">Fandry</span>
          </Link>
          <nav className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/feed">
                  <Button variant="ghost" className="font-medium">フィード</Button>
                </Link>
                <Link href="/discover">
                  <Button variant="ghost" className="font-medium">発見</Button>
                </Link>
                <Link href="/my">
                  <Button className="shine-effect font-medium">マイページ</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <Link href="/discover">
                  <Button variant="ghost" className="font-medium">クリエイターを探す</Button>
                </Link>
                <SignInButton mode="modal">
                  <Button className="shine-effect font-medium">ログイン</Button>
                </SignInButton>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 md:py-36 relative">
        {/* Floating decorations */}
        <div className="absolute top-20 left-10 animate-float opacity-20">
          <Star className="h-8 w-8 text-primary fill-primary" />
        </div>
        <div className="absolute top-40 right-20 animate-float stagger-2 opacity-15">
          <Heart className="h-6 w-6 text-primary fill-primary" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float stagger-3 opacity-10">
          <Sparkles className="h-10 w-10 text-[oklch(0.85_0.16_85)]" />
        </div>

        <div className="mx-auto max-w-4xl text-center space-y-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 animate-fade-up">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-foreground">感謝を、1秒で届ける</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] opacity-0 animate-fade-up stagger-1">
            あなたの「応援」が、
            <br />
            <span className="text-gradient">クリエイターを支える</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-up stagger-2">
            Fandryは、クリエイターとファンをつなぐパトロン型支援プラットフォーム。
            <br className="hidden md:block" />
            投げ銭、有料コンテンツ、月額支援で、好きなクリエイターを応援しよう。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up stagger-3">
            <Link href="/discover">
              <Button size="lg" className="text-lg px-8 h-14 shine-effect glow-primary group">
                クリエイターを探す
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <SignInButton mode="modal">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-2 hover:bg-secondary">
                  無料で始める
                </Button>
              </SignInButton>
            )}
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-8 pt-6 opacity-0 animate-fade-up stagger-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">1,000+ クリエイター</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-5 w-5 text-primary fill-primary" />
              <span className="text-sm font-medium">50,000+ 応援</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16 opacity-0 animate-fade-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fandryの特徴</h2>
            <p className="text-muted-foreground text-lg">シンプルで使いやすい、クリエイター支援プラットフォーム</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 card-interactive opacity-0 animate-fade-up stagger-1">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:scale-110 transition-transform">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">ワンクリック投げ銭</h3>
              <p className="text-muted-foreground leading-relaxed">
                決済画面を挟まず、1秒で「応援」の気持ちを届けられます。
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 card-interactive opacity-0 animate-fade-up stagger-2">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[oklch(0.85_0.16_85)]/20 to-[oklch(0.85_0.16_85)]/5 group-hover:scale-110 transition-transform">
                <Heart className="h-7 w-7 text-[oklch(0.85_0.16_85)]" />
              </div>
              <h3 className="text-xl font-bold mb-3">低手数料</h3>
              <p className="text-muted-foreground leading-relaxed">
                投げ銭は8%、その他は10%の業界最安水準の手数料。
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 card-interactive opacity-0 animate-fade-up stagger-3">
              <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">パトロンバッジ</h3>
              <p className="text-muted-foreground leading-relaxed">
                累計支援額に応じてバッジを獲得。あなたの貢献を可視化します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center glass-card border border-primary/10">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[oklch(0.85_0.16_85)]/10" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[oklch(0.85_0.16_85)]/15 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
                <Heart className="h-8 w-8 text-primary fill-primary animate-heart-pulse" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">今すぐ始めよう</h2>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                あなたの「応援」が、クリエイターの活動を支えます。
                <br />
                好きなクリエイターを見つけて、応援を届けましょう。
              </p>
              <Link href="/discover">
                <Button size="lg" className="text-lg px-10 h-14 shine-effect glow-primary group mt-4">
                  クリエイターを探す
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 bg-card/30 backdrop-blur-sm">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Heart className="h-5 w-5 text-primary fill-primary" />
              <span className="font-semibold">Fandry</span>
              <span className="text-sm text-muted-foreground ml-2">
                &copy; 2024 All rights reserved.
              </span>
            </div>
            <nav className="flex items-center gap-8 text-sm">
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                お問い合わせ
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
