import {
  publicProcedure,
  protectedProcedure,
  router,
  z,
} from "./_shared";
import { getCommentsByPostId, createComment } from "../db";

export const commentRouter = router({
  getByPostId: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      return getCommentsByPostId(input.postId);
    }),

  create: protectedProcedure
    .input(z.object({
      postId: z.number(),
      content: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      await createComment({
        userId: ctx.user.id,
        postId: input.postId,
        content: input.content,
      });
      return { success: true };
    }),
});
