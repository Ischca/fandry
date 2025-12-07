import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { User } from "lucide-react";
import { useParams, Link } from "wouter";
import { TipDialog } from "@/components/TipDialog";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { toast } from "sonner";
import { useState } from "react";
import {
  CompactHero,
  StatsBar,
  ProfileLinks,
  WorksGallery,
  MembershipSection,
  FloatingActions,
  FeaturedPosts,
} from "./creatorpage-components";

export default function CreatorPage() {
  const { username } = useParams<{ username: string }>();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: creator?.displayName,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("リンクをコピーしました");
      }
    } catch {
      // User cancelled share
    }
  };

  const { data: creator, isLoading: creatorLoading } =
    trpc.creator.getByUsername.useQuery(
      { username: username || "" },
      { enabled: !!username }
    );

  const { data: myCreator } = trpc.creator.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isOwnProfile =
    isAuthenticated && myCreator && creator && myCreator.id === creator.id;

  const { data: posts, isLoading: postsLoading } =
    trpc.post.getByCreatorUsername.useQuery(
      { username: username || "", limit: 20 },
      { enabled: !!username }
    );

  const { data: followData } = trpc.follow.check.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: isAuthenticated && !!creator }
  );

  const { data: blockData } = trpc.block.check.useQuery(
    { userId: creator?.userId || 0 },
    { enabled: isAuthenticated && !!creator }
  );

  const blockMutation = trpc.block.toggle.useMutation({
    onSuccess: result => {
      utils.block.check.invalidate({ userId: creator?.userId || 0 });
      toast.success(
        result.blocked ? "ブロックしました" : "ブロックを解除しました"
      );
    },
    onError: error => toast.error(`エラー: ${error.message}`),
  });

  const isBlocked = blockData?.blocked || false;

  const { data: plans } = trpc.subscriptionPlan.getByCreatorId.useQuery(
    { creatorId: creator?.id || 0 },
    { enabled: !!creator }
  );

  const followMutation = trpc.follow.toggle.useMutation({
    onMutate: async () => {
      if (!creator) return;
      await utils.follow.check.cancel({ creatorId: creator.id });
      await utils.creator.getByUsername.cancel({ username: username || "" });

      const previousFollowData = utils.follow.check.getData({
        creatorId: creator.id,
      });
      const previousCreatorData = utils.creator.getByUsername.getData({
        username: username || "",
      });

      if (previousFollowData) {
        utils.follow.check.setData(
          { creatorId: creator.id },
          { following: !previousFollowData.following }
        );
      }
      if (previousCreatorData) {
        utils.creator.getByUsername.setData(
          { username: username || "" },
          {
            ...previousCreatorData,
            followerCount:
              previousCreatorData.followerCount +
              (previousFollowData?.following ? -1 : 1),
          }
        );
      }

      return { previousFollowData, previousCreatorData };
    },
    onError: (_err, _variables, context) => {
      if (!creator) return;
      if (context?.previousFollowData) {
        utils.follow.check.setData(
          { creatorId: creator.id },
          context.previousFollowData
        );
      }
      if (context?.previousCreatorData) {
        utils.creator.getByUsername.setData(
          { username: username || "" },
          context.previousCreatorData
        );
      }
      toast.error("エラーが発生しました");
    },
    onSuccess: data =>
      toast.success(
        data.following ? "フォローしました" : "フォローを解除しました"
      ),
    onSettled: () => {
      utils.follow.check.invalidate({ creatorId: creator?.id || 0 });
      utils.creator.getByUsername.invalidate({ username: username || "" });
    },
  });

  const isFollowing = followData?.following || false;

  // Loading state
  if (creatorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!creator) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">クリエイターが見つかりません</h1>
          <p className="text-muted-foreground">URLを確認してください</p>
        </div>
        <Link href="/discover">
          <Button size="lg">クリエイターを探す</Button>
        </Link>
      </div>
    );
  }

  const handleTipClick = () => {
    if (isAuthenticated) {
      setTipDialogOpen(true);
    }
  };

  // Parse showStats/showPosts with defaults
  const showStats = creator.showStats !== 0;
  const showPosts = creator.showPosts !== 0;
  const accentColor = creator.accentColor || "#E05A3A"; // Default to Fandry coral

  return (
    <div
      className="min-h-screen bg-background"
      style={{ "--creator-accent": accentColor } as React.CSSProperties}
    >
      {/* Compact Hero - centered, mobile-friendly */}
      <CompactHero
        displayName={creator.displayName}
        username={creator.username}
        avatarUrl={creator.avatarUrl}
        coverUrl={creator.coverUrl}
        bio={creator.bio}
        category={creator.category}
        creatorTitle={creator.creatorTitle}
        skillTags={creator.skillTags}
        creatorStatus={creator.creatorStatus}
        statusMessage={creator.statusMessage}
        accentColor={accentColor}
      />

      {/* Stats Bar */}
      <StatsBar
        followerCount={creator.followerCount}
        totalSupport={creator.totalSupport}
        showStats={showStats}
      />

      {/* Profile Links (litlink-style) */}
      <ProfileLinks
        linksJson={creator.profileLinks ?? null}
        socialLinksJson={creator.socialLinks}
      />

      {/* Featured Posts (pinned) */}
      {posts && posts.length > 0 && (
        <FeaturedPosts
          featuredPostIds={creator.featuredPostIds}
          posts={posts}
          creatorUsername={creator.username}
        />
      )}

      {/* Membership Section - above posts for visibility */}
      {plans && plans.length > 0 && (
        <MembershipSection
          plans={plans}
          onSubscribe={() => setSubscribeDialogOpen(true)}
        />
      )}

      {/* Works Gallery */}
      {showPosts && !postsLoading && posts && posts.length > 0 && (
        <WorksGallery posts={posts} creatorUsername={creator.username} />
      )}

      {/* Loading state for posts */}
      {showPosts && postsLoading && (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Footer spacer for floating bar */}
      <div className="h-24" />

      {/* Floating Action Bar */}
      {!isOwnProfile && (
        <FloatingActions
          isAuthenticated={isAuthenticated}
          isOwnProfile={!!isOwnProfile}
          isFollowing={isFollowing}
          isBlocked={isBlocked}
          isPending={followMutation.isPending || blockMutation.isPending}
          onFollow={() => followMutation.mutate({ creatorId: creator.id })}
          onTip={handleTipClick}
          onShare={handleShare}
          onBlock={() => blockMutation.mutate({ userId: creator.userId })}
          onReport={() => setReportDialogOpen(true)}
        />
      )}

      {/* Own profile edit link */}
      {isOwnProfile && (
        <div className="fixed bottom-4 right-4 z-50">
          <Link href="/settings/profile">
            <Button className="rounded-full shadow-lg gap-2">
              プロフィール編集
            </Button>
          </Link>
        </div>
      )}

      {/* Dialogs */}
      {isAuthenticated && !isOwnProfile && (
        <>
          <TipDialog
            open={tipDialogOpen}
            onOpenChange={setTipDialogOpen}
            creatorId={creator.id}
            creatorName={creator.displayName}
          />
          {plans && plans.length > 0 && (
            <SubscribeDialog
              open={subscribeDialogOpen}
              onOpenChange={setSubscribeDialogOpen}
              plans={plans}
              creatorId={creator.id}
              creatorName={creator.displayName}
            />
          )}
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            targetType="creator"
            targetId={creator.id}
            targetName={creator.username}
          />
        </>
      )}

      {/* Sign in prompt for support */}
      {!isAuthenticated && !isOwnProfile && (
        <SignInButton mode="modal">
          <button className="sr-only">Sign in to support</button>
        </SignInButton>
      )}
    </div>
  );
}
