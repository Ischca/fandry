import { useAuth } from "@/_core/hooks/useAuth";
import { SignInButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Heart,
  MoreHorizontal,
  Flag,
  Ban,
  Users,
  Settings,
  Check,
} from "lucide-react";
import { Link } from "wouter";
import { TipDialog } from "@/components/TipDialog";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { ReportDialog } from "@/components/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import type { CreatorPageData } from "../+data";

interface AuthActionsProps {
  creator: NonNullable<CreatorPageData["creator"]>;
  plans: CreatorPageData["plans"];
}

function AuthActionsInner({ creator, plans }: AuthActionsProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [tipDialogOpen, setTipDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const { data: myCreator } = trpc.creator.getMe.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isOwnProfile =
    isAuthenticated && myCreator && myCreator.id === creator.id;

  const { data: followData } = trpc.follow.check.useQuery(
    { creatorId: creator.id },
    { enabled: isAuthenticated }
  );

  const { data: blockData } = trpc.block.check.useQuery(
    { userId: creator.userId },
    { enabled: isAuthenticated }
  );

  const blockMutation = trpc.block.toggle.useMutation({
    onSuccess: result => {
      utils.block.check.invalidate({ userId: creator.userId });
      toast.success(
        result.blocked ? "ブロックしました" : "ブロックを解除しました"
      );
    },
    onError: error => toast.error(`エラー: ${error.message}`),
  });

  const followMutation = trpc.follow.toggle.useMutation({
    onMutate: async () => {
      await utils.follow.check.cancel({ creatorId: creator.id });
      const prev = utils.follow.check.getData({ creatorId: creator.id });
      if (prev)
        utils.follow.check.setData(
          { creatorId: creator.id },
          { following: !prev.following }
        );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        utils.follow.check.setData({ creatorId: creator.id }, ctx.prev);
      toast.error("エラーが発生しました");
    },
    onSuccess: data =>
      toast.success(data.following ? "フォローしました" : "フォロー解除しました"),
    onSettled: () => utils.follow.check.invalidate({ creatorId: creator.id }),
  });

  const isFollowing = followData?.following || false;
  const isBlocked = blockData?.blocked || false;

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2 rounded-full bg-card/95 backdrop-blur-xl border shadow-2xl shadow-black/10">
          {isOwnProfile ? (
            <Link href="/settings/profile">
              <Button className="rounded-full gap-2 px-6">
                <Settings className="h-4 w-4" />
                プロフィール編集
              </Button>
            </Link>
          ) : (
            <>
              {isAuthenticated ? (
                <>
                  <Button
                    variant={isFollowing ? "secondary" : "outline"}
                    className="rounded-full px-5"
                    onClick={() =>
                      followMutation.mutate({ creatorId: creator.id })
                    }
                    disabled={followMutation.isPending}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-4 w-4 mr-1.5" />
                        フォロー中
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-1.5" />
                        フォロー
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setTipDialogOpen(true)}
                    className="rounded-full gap-2 px-6 bg-gradient-to-r from-primary to-[oklch(0.55_0.18_35)] hover:opacity-90 shadow-lg shadow-primary/25"
                  >
                    <Heart className="h-4 w-4" />
                    応援する
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          blockMutation.mutate({ userId: creator.userId })
                        }
                        disabled={blockMutation.isPending}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {isBlocked ? "ブロック解除" : "ブロック"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setReportDialogOpen(true)}
                        className="text-destructive"
                      >
                        <Flag className="h-4 w-4 mr-2" />
                        通報する
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <SignInButton mode="modal">
                  <Button className="rounded-full gap-2 px-6 bg-gradient-to-r from-primary to-[oklch(0.55_0.18_35)]">
                    <Heart className="h-4 w-4" />
                    応援する
                  </Button>
                </SignInButton>
              )}
            </>
          )}
        </div>
      </div>

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
    </>
  );
}

export function ClientOnlyAuthActions(props: AuthActionsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <AuthActionsInner {...props} />;
}
