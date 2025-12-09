import {
  protectedProcedure,
  router,
  z,
} from "./_shared";
import { followCreator, unfollowCreator, isFollowing, getCreatorById } from "../db";
import { createNotification } from "./notification";

export const followRouter = router({
  toggle: protectedProcedure
    .input(z.object({ creatorId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const following = await isFollowing(ctx.user.id, input.creatorId);
      if (following) {
        await unfollowCreator(ctx.user.id, input.creatorId);
        return { following: false };
      } else {
        await followCreator(ctx.user.id, input.creatorId);

        // Send notification to creator
        const creator = await getCreatorById(input.creatorId);
        if (creator && creator.userId !== ctx.user.id) {
          await createNotification({
            userId: creator.userId,
            type: "follow",
            title: "新しいフォロワー",
            message: "あなたをフォローしました",
            actorId: ctx.user.id,
            targetType: "creator",
            targetId: input.creatorId,
            link: `/mypage`,
          });
        }

        return { following: true };
      }
    }),

  check: protectedProcedure
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ ctx, input }) => {
      return { following: await isFollowing(ctx.user.id, input.creatorId) };
    }),
});
