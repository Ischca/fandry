import {
  publicProcedure,
  protectedProcedure,
  router,
  z,
} from "./_shared";
import { getCommentsByPostId, createComment, getPostById, getCreatorById } from "../db";
import { createNotification } from "./notification";

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

      // Send notification to post creator
      const post = await getPostById(input.postId);
      if (post) {
        const creator = await getCreatorById(post.creatorId);
        if (creator && creator.userId !== ctx.user.id) {
          await createNotification({
            userId: creator.userId,
            type: "comment",
            title: "新しいコメント",
            message: input.content.slice(0, 100),
            actorId: ctx.user.id,
            targetType: "post",
            targetId: input.postId,
            link: `/@${creator.username}/posts/${input.postId}`,
          });
        }
      }

      return { success: true };
    }),
});
