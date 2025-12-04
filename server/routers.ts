import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  creatorRouter,
  postRouter,
  tipRouter,
  followRouter,
  commentRouter,
  feedRouter,
  discoverRouter,
  rankingRouter,
  likeRouter,
  subscriptionPlanRouter,
  uploadRouter,
  reportRouter,
  blockRouter,
  revenueRouter,
  pointRouter,
  purchaseRouter,
  subscriptionRouter,
} from "./routers/index";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => ({ success: true } as const)),
  }),
  creator: creatorRouter,
  post: postRouter,
  tip: tipRouter,
  revenue: revenueRouter,
  follow: followRouter,
  comment: commentRouter,
  feed: feedRouter,
  discover: discoverRouter,
  ranking: rankingRouter,
  like: likeRouter,
  subscriptionPlan: subscriptionPlanRouter,
  upload: uploadRouter,
  report: reportRouter,
  block: blockRouter,
  point: pointRouter,
  purchase: purchaseRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
