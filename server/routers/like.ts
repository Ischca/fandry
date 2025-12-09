import {
  protectedProcedure,
  router,
  z,
} from "./_shared";
import { likePost, unlikePost, hasLiked, getPostById, getCreatorById } from "../db";
import { createNotification } from "./notification";

export const likeRouter = router({
  toggle: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const liked = await hasLiked(ctx.user.id, input.postId);
      if (liked) {
        await unlikePost(ctx.user.id, input.postId);
        return { liked: false };
      } else {
        await likePost(ctx.user.id, input.postId);

        // Send notification to post creator
        const post = await getPostById(input.postId);
        if (post) {
          const creator = await getCreatorById(post.creatorId);
          if (creator && creator.userId !== ctx.user.id) {
            await createNotification({
              userId: creator.userId,
              type: "like",
              title: "いいね",
              message: `「${post.title || "投稿"}」にいいねしました`,
              actorId: ctx.user.id,
              targetType: "post",
              targetId: input.postId,
              link: `/@${creator.username}/posts/${input.postId}`,
            });
          }
        }

        return { liked: true };
      }
    }),

  check: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      return { liked: await hasLiked(ctx.user.id, input.postId) };
    }),
});
