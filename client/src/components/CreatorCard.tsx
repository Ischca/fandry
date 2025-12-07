import { Users, UserPlus, UserMinus } from "lucide-react";
import { Link } from "wouter";
import { useClerk } from "@clerk/clerk-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

interface CreatorCardProps {
  creator: {
    id: number;
    username: string;
    displayName: string;
    bio?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    followerCount: number;
    category?: string | null;
  };
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const { isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();
  const utils = trpc.useUtils();
  const { data: followStatus } = trpc.follow.check.useQuery(
    { creatorId: creator.id },
    { enabled: isAuthenticated }
  );

  const followMutation = trpc.follow.toggle.useMutation({
    onSuccess: (data) => {
      utils.follow.check.invalidate({ creatorId: creator.id });
      utils.discover.getAllCreators.invalidate();
      toast.success(data.following ? "フォローしました" : "フォローを解除しました");
    },
    onError: () => {
      toast.error("エラーが発生しました");
    },
  });

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    followMutation.mutate({ creatorId: creator.id });
  };

  const isFollowing = followStatus?.following || false;

  return (
    <Link href={`/creator/${creator.username}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="p-0">
        {/* Cover Image */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20">
          {creator.coverUrl && (
            <img
              src={creator.coverUrl}
              alt={creator.displayName}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Creator Info */}
        <div className="p-4">
          <div className="flex items-start gap-4 -mt-12 mb-4">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarImage src={creator.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {creator.displayName[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <div>
              <h3 className="font-bold text-lg">{creator.displayName}</h3>
              <p className="text-sm text-muted-foreground">@{creator.username}</p>
            </div>

            {creator.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {creator.bio}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{creator.followerCount} フォロワー</span>
              </div>
              {creator.category && (
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                  {creator.category}
                </span>
              )}
            </div>

            {isAuthenticated && (
              <div className="mt-4">
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  className="w-full"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      フォロー中
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      フォロー
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
        </CardContent>
      </Card>
    </Link>
  );
}
