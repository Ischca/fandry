import {
  protectedProcedure,
  router,
} from "./_shared";
import { getFollowingPosts } from "../db";

export const feedRouter = router({
  getFollowingPosts: protectedProcedure.query(async ({ ctx }) => {
    return await getFollowingPosts(ctx.user.id);
  }),
});
