import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { PurchaseDialog } from "@/components/PurchaseDialog";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { ReportDialog } from "@/components/ReportDialog";
import { toast } from "sonner";
import type { PostPageData } from "../+data";

interface PostActionsProps {
  post: NonNullable<PostPageData["post"]>;
  plans: PostPageData["plans"];
}

export function PostActions({ post, plans }: PostActionsProps) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const postId = post.id;

  const { data: postWithAccess } = trpc.post.getById.useQuery(
    { id: postId },
    { enabled: postId > 0 }
  );

  const currentPost = postWithAccess || post;

  const { data: likeData } = trpc.like.check.useQuery(
    { postId },
    { enabled: isAuthenticated && postId > 0 }
  );

  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const likeMutation = trpc.like.toggle.useMutation({
    onMutate: async () => {
      await utils.like.check.cancel({ postId });
      await utils.post.getById.cancel({ id: postId });
      const previousLikeData = utils.like.check.getData({ postId });
      const previousPostData = utils.post.getById.getData({ id: postId });
      if (previousLikeData) {
        utils.like.check.setData({ postId }, { liked: !previousLikeData.liked });
      }
      if (previousPostData) {
        utils.post.getById.setData(
          { id: postId },
          {
            ...previousPostData,
            likeCount:
              previousPostData.likeCount + (previousLikeData?.liked ? -1 : 1),
          }
        );
      }
      return { previousLikeData, previousPostData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousLikeData) {
        utils.like.check.setData({ postId }, context.previousLikeData);
      }
      if (context?.previousPostData) {
        utils.post.getById.setData({ id: postId }, context.previousPostData);
      }
      toast.error("エラーが発生しました");
    },
    onSettled: () => {
      utils.like.check.invalidate({ postId });
      utils.post.getById.invalidate({ id: postId });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("いいねするにはログインが必要です");
      return;
    }
    likeMutation.mutate({ postId });
  };

  const handlePurchaseSuccess = () => {
    utils.post.getById.invalidate({ id: postId });
  };

  const handleSubscribeSuccess = () => {
    utils.post.getById.invalidate({ id: postId });
  };

  const isLiked = likeData?.liked || false;

  return (
    <>
      {/* Locked Content CTA */}
      {!currentPost.hasAccess && post.type !== "free" && isAuthenticated && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() =>
              post.type === "paid"
                ? setPurchaseDialogOpen(true)
                : setSubscribeDialogOpen(true)
            }
            className={`gap-2 ${
              post.type === "paid"
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {post.type === "paid" ? (
              <>¥{post.price?.toLocaleString()}で購入</>
            ) : (
              <>プランを見る</>
            )}
          </Button>
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="sticky bottom-4 z-40 flex justify-center">
        <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-card/95 backdrop-blur-xl border shadow-lg shadow-black/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={`rounded-full gap-2 px-4 transition-all ${
              isLiked
                ? "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform ${isLiked ? "fill-current scale-110" : ""}`}
            />
            <span className="font-medium">{currentPost.likeCount}</span>
          </Button>

          <div className="w-px h-5 bg-border" />

          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-2 px-4 text-muted-foreground hover:text-foreground"
            onClick={() =>
              document
                .getElementById("comments")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{currentPost.commentCount}</span>
          </Button>

          <div className="w-px h-5 bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      {post.type === "paid" && (
        <PurchaseDialog
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          postId={post.id}
          postTitle={post.title}
          price={post.price || 0}
          creatorName={post.creatorDisplayName || "クリエイター"}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {post.type === "membership" && plans && (
        <SubscribeDialog
          open={subscribeDialogOpen}
          onOpenChange={setSubscribeDialogOpen}
          plans={plans}
          creatorId={post.creatorId}
          creatorName={post.creatorDisplayName || "クリエイター"}
          requiredTier={post.membershipTier || undefined}
          onSuccess={handleSubscribeSuccess}
        />
      )}

      <ReportDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        targetType="post"
        targetId={post.id}
      />
    </>
  );
}
