import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Heart, Trophy, Users, Sparkles, User, TrendingUp } from "lucide-react";
import { Link } from "wouter";

type RankingType = "support" | "followers" | "newest";

const RANKING_TABS: { type: RankingType; label: string; icon: React.ReactNode }[] = [
  { type: "support", label: "サポート額", icon: <TrendingUp className="h-4 w-4" /> },
  { type: "followers", label: "フォロワー", icon: <Users className="h-4 w-4" /> },
  { type: "newest", label: "新着", icon: <Sparkles className="h-4 w-4" /> },
];

export default function Ranking() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<RankingType>("support");

  const { data: supportRanking, isLoading: loadingSupport } = trpc.ranking.bySupport.useQuery(
    { limit: 50 },
    { enabled: activeTab === "support" }
  );

  const { data: followerRanking, isLoading: loadingFollowers } = trpc.ranking.byFollowers.useQuery(
    { limit: 50 },
    { enabled: activeTab === "followers" }
  );

  const { data: newestRanking, isLoading: loadingNewest } = trpc.ranking.newest.useQuery(
    { limit: 50 },
    { enabled: activeTab === "newest" }
  );

  const getCurrentRanking = () => {
    switch (activeTab) {
      case "support":
        return { data: supportRanking, loading: loadingSupport };
      case "followers":
        return { data: followerRanking, loading: loadingFollowers };
      case "newest":
        return { data: newestRanking, loading: loadingNewest };
    }
  };

  const { data: creators, loading } = getCurrentRanking();

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
          <Trophy className="h-4 w-4 text-yellow-500" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-400/20">
          <Trophy className="h-4 w-4 text-gray-400" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-700/20">
          <Trophy className="h-4 w-4 text-orange-700" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-8 h-8 text-muted-foreground font-bold">
        {rank}
      </div>
    );
  };

  const getStatDisplay = (creator: NonNullable<typeof creators>[number]) => {
    switch (activeTab) {
      case "support":
        return (
          <p className="text-sm font-medium text-primary">
            ¥{creator.totalSupport.toLocaleString()}
          </p>
        );
      case "followers":
        return (
          <p className="text-sm font-medium text-primary">
            {creator.followerCount.toLocaleString()}人
          </p>
        );
      case "newest":
        return (
          <p className="text-xs text-muted-foreground">
            {new Date(creator.createdAt).toLocaleDateString("ja-JP")}
          </p>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary fill-primary" />
            <span className="text-xl font-bold">Fandry</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/discover">
              <Button variant="ghost">発見</Button>
            </Link>
            {isAuthenticated ? (
              <Link href="/my">
                <Button variant="ghost">マイページ</Button>
              </Link>
            ) : (
              <Link href="/">
                <Button>ログイン</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-3xl py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">ランキング</h1>
          <p className="text-muted-foreground">
            人気のクリエイターをチェックしよう
          </p>
        </div>

        {/* タブ */}
        <div className="flex gap-2 mb-6 justify-center">
          {RANKING_TABS.map((tab) => (
            <Button
              key={tab.type}
              variant={activeTab === tab.type ? "default" : "outline"}
              onClick={() => setActiveTab(tab.type)}
              className="gap-2"
            >
              {tab.icon}
              {tab.label}
            </Button>
          ))}
        </div>

        {/* ランキングリスト */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            読み込み中...
          </div>
        ) : creators && creators.length > 0 ? (
          <div className="space-y-3">
            {creators.map((creator, index) => (
              <Link
                key={creator.id}
                href={`/creator/${creator.username}`}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    {getRankBadge(index + 1)}

                    <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {creator.avatarUrl ? (
                        <img
                          src={creator.avatarUrl}
                          alt={creator.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {creator.displayName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{creator.username}
                      </p>
                    </div>

                    <div className="text-right">
                      {getStatDisplay(creator)}
                      {activeTab === "support" && (
                        <p className="text-xs text-muted-foreground">
                          累計サポート
                        </p>
                      )}
                      {activeTab === "followers" && (
                        <p className="text-xs text-muted-foreground">
                          フォロワー
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              まだランキングデータがありません
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
