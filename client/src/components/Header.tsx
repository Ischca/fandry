import { Link, useLocation } from "wouter";
import { SignInButton } from "@clerk/clerk-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PointBalance } from "@/components/PointBalance";
import { NotificationBell } from "@/components/NotificationBell";
import {
  Heart,
  PenSquare,
  Search,
  Trophy,
  Home,
  Compass,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";

interface HeaderProps {
  /** Hide navigation on specific pages like post detail */
  minimal?: boolean;
}

export function Header({ minimal = false }: HeaderProps) {
  const { isAuthenticated, user } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Get creator profile for avatar
  const { data: creatorProfile } = trpc.creator.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const navItems = [
    { href: "/feed", label: "フィード", icon: Home },
    { href: "/discover", label: "発見", icon: Compass },
    { href: "/ranking", label: "ランキング", icon: Trophy },
  ];

  const isActive = (href: string) => location === href;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="relative">
            <Heart className="h-6 w-6 text-primary fill-primary transition-transform group-hover:scale-110" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:inline">Fandry</span>
        </Link>

        {/* Desktop Navigation */}
        {!minimal && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-2 font-medium ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Search */}
        {!minimal && (
          <form
            className="hidden lg:flex flex-1 max-w-md mx-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
                setSearchQuery("");
              }
            }}
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="クリエイターを検索..."
                className="w-full h-9 pl-9 pr-4 rounded-full border border-border/50 bg-muted/30 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>
          </form>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Create Post Button */}
              {!minimal && (
                <Link href="/create-post">
                  <Button
                    size="sm"
                    className="gap-2 hidden sm:inline-flex"
                  >
                    <PenSquare className="h-4 w-4" />
                    <span className="hidden lg:inline">投稿</span>
                  </Button>
                </Link>
              )}

              {/* Point Balance */}
              <div className="hidden sm:block">
                <PointBalance />
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* User Avatar */}
              <Link href="/my">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8 ring-2 ring-background">
                    <AvatarImage src={creatorProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {creatorProfile?.displayName?.[0] || user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </Link>

              {/* Mobile menu button */}
              {!minimal && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              )}
            </>
          ) : (
            <>
              <Link href="/discover">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  クリエイターを探す
                </Button>
              </Link>
              <SignInButton mode="modal">
                <Button size="sm">ログイン</Button>
              </SignInButton>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {!minimal && mobileMenuOpen && isAuthenticated && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <nav className="container py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}

            <div className="border-t border-border/50 my-2 pt-2">
              <Link href="/create-post" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                  <PenSquare className="h-5 w-5" />
                  <span className="font-medium">投稿を作成</span>
                </div>
              </Link>
            </div>

            <div className="px-3 py-2">
              <PointBalance />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
