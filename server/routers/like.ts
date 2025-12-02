import {
  protectedProcedure,
  router,
  z,
} from "./_shared";
import { likePost, unlikePost, hasLiked } from "../db";

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
        return { liked: true };
      }
    }),

  check: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      return { liked: await hasLiked(ctx.user.id, input.postId) };
    }),
});
