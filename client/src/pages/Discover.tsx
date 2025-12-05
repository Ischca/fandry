import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CreatorCard } from "@/components/CreatorCard";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Loader2, Heart, Search } from "lucide-react";

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: allCreators, isLoading } = trpc.discover.getAllCreators.useQuery({ limit: 50 });
  const { data: searchResults, isLoading: isSearching } = trpc.discover.searchCreators.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const displayCreators = searchQuery.length > 0 ? searchResults : allCreators;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Search Section */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold">クリエイターを発見</h1>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="クリエイターを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {(isLoading || isSearching) && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Creators Grid */}
          {!isLoading && !isSearching && displayCreators && displayCreators.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                {searchQuery.length > 0 ? "検索結果" : "人気のクリエイター"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayCreators.map((creator) => (
                  <CreatorCard key={creator.id} creator={creator} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isSearching && (!displayCreators || displayCreators.length === 0) && (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {searchQuery.length > 0 ? "検索結果が見つかりません" : "クリエイターが見つかりません"}
              </h2>
              <p className="text-muted-foreground">
                {searchQuery.length > 0 ? "別のキーワードで試してみてください" : "まだ登録されているクリエイターがいません"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
